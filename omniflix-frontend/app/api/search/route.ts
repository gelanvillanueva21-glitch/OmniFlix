import { NextRequest, NextResponse } from "next/server";
import { searchJikanAnime } from "@/service/jikan/jikan.service";
import { searchLncrawlNovels } from "@/service/lncrawl/lncrawl.service";
import { searchSuwayomiComics } from "@/service/suwayomi/suwayomi.service";
import { searchTmdbMovies, searchTmdbTv } from "@/service/tmdb/tmdb.service";
import { uniqueMediaItems } from "@/service/provider-client.service";
import type { MediaItem } from "@/lib/media";
import { getCurrentUser } from "@/service/user.service";
import { ApiError } from "@/service/client.service";
import { prisma } from "@/service/prisma.service";

const MAX_QUERY_LENGTH = 100;
const PER_PROVIDER_LIMIT = 8;

interface GlobalSearchResponse {
  items: MediaItem[];
  /** True while any successful provider still reports more pages. */
  hasNextPage: boolean;
  /** Present only when every provider failed. */
  error?: string;
}

/**
 * Global Explore search: queries every supported provider (Suwayomi comics,
 * LNcrawl novels, TMDB movies, TMDB series, Jikan anime) concurrently through
 * the existing service layer — provider credentials stay server-side and no
 * internal API route is called from another one. Each provider returns at
 * most `PER_PROVIDER_LIMIT` items; one failing provider degrades to an empty
 * contribution instead of failing the whole request.
 */
export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
    if (!query) {
        return NextResponse.json({
        items: [],
        hasNextPage: false,
        } satisfies GlobalSearchResponse);
    }
    if (query.length > MAX_QUERY_LENGTH) {
        return NextResponse.json(
        { error: `Query must be at most ${MAX_QUERY_LENGTH} characters.` },
        { status: 400 },
        );
    }

    const results = await Promise.allSettled([
        searchSuwayomiComics(query, PER_PROVIDER_LIMIT),
        searchLncrawlNovels(query, PER_PROVIDER_LIMIT),
        searchTmdbMovies(query, 1, PER_PROVIDER_LIMIT),
        searchTmdbTv(query, 1, PER_PROVIDER_LIMIT),
        searchJikanAnime(query, 1, PER_PROVIDER_LIMIT),
    ]);

    const items: MediaItem[] = [];
    const errors: string[] = [];
    let hasNextPage = false;

    const normalize = (
        value:
            | MediaItem[]
            | Awaited<ReturnType<typeof searchSuwayomiComics>>
            | Awaited<ReturnType<typeof searchTmdbMovies>>
            | Awaited<ReturnType<typeof searchTmdbTv>>
            | Awaited<ReturnType<typeof searchJikanAnime>>,
    ): { items: MediaItem[]; hasNextPage: boolean } =>
        Array.isArray(value)
            ? { items: value, hasNextPage: false }
            : { items: value.items, hasNextPage: "hasNextPage" in value ? value.hasNextPage : false };

    results.forEach((result, index) => {
        if (result.status === "rejected") {
        const message =
            result.reason instanceof Error
            ? result.reason.message
            : "Unknown provider error";
        // Provider errors can embed internal hostnames; log server-side
        // and surface a generic per-provider failure to the browser.
        console.error(
            `[api/search] provider ${PROVIDER_NAMES[index]} failed:`,
            message,
        );
        errors.push(`The ${PROVIDER_NAMES[index]} search is unavailable.`);
        return;
        }
        const normalized = normalize(result.value);
        items.push(...normalized.items);
        hasNextPage = hasNextPage || normalized.hasNextPage;
    });

    if (errors.length === results.length) {
        return NextResponse.json(
        { error: "All search providers are unavailable right now." },
        { status: 502 },
        );
    }

    return NextResponse.json({
        items: uniqueMediaItems(items),
        hasNextPage,
        ...(errors.length > 0 ? { error: errors[0] } : {}),
    } satisfies GlobalSearchResponse);
}

const PROVIDER_NAMES = [
    "comics",
    "novels",
    "movies",
    "series",
    "anime",
] as const;

type SearchHistoryRequest = {
    title: string;
    /** Required only when `isGlobal` is false — feature-page searches always know their category. */
    type?: "COMIC" | "NOVEL" | "SERIES" | "MOVIE";
    isGlobal?: boolean;
};

const VALID_SEARCH_TYPES: ReadonlySet<string> = new Set([
    "COMIC",
    "NOVEL",
    "SERIES",
    "MOVIE",
]);

/**
 * Records a search term on the authenticated user's profile so it can be
 * replayed later from their search history. Accepts only the fields the
 * `SearchHistory` model actually stores; anything else is rejected before it
 * reaches Prisma so unvalidated client data never hits the database.
 */
export async function POST(request: NextRequest) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Request body must be valid JSON." },
            { status: 400 },
        );
    }

    const data = body as Partial<SearchHistoryRequest> | null;
    const title = typeof data?.title === "string" ? data.title.trim() : "";
    const type = data?.type;
    const isGlobal = data?.isGlobal ?? false;

    if (!title) {
        return NextResponse.json(
            { error: "A search title is required." },
            { status: 400 },
        );
    }
    if (title.length > MAX_QUERY_LENGTH) {
        return NextResponse.json(
            { error: `Search title must be at most ${MAX_QUERY_LENGTH} characters.` },
            { status: 400 },
        );
    }
    if (typeof isGlobal !== "boolean") {
        return NextResponse.json(
            { error: "isGlobal must be a boolean." },
            { status: 400 },
        );
    }
    // Feature-page searches (isGlobal === false) always originate from one of
    // the four categories, so the type must be supplied. Global searches are
    // category-agnostic and must not send one.
    if (isGlobal) {
        if (type !== undefined) {
            return NextResponse.json(
                { error: "Global searches must not include a type." },
                { status: 400 },
            );
        }
    } else if (typeof type !== "string" || !VALID_SEARCH_TYPES.has(type)) {
        return NextResponse.json(
            { error: "Search type must be one of COMIC, NOVEL, SERIES or MOVIE for feature searches." },
            { status: 400 },
        );
    }

    try {
        // getCurrentUser performs a server-side fetch, so the incoming
        // request's Cookie header must be forwarded explicitly — it is not
        // propagated automatically like it is in the browser.
        const user = await getCurrentUser({
            headers: { Cookie: request.headers.get("cookie") ?? "" },
        });
        const profile = await prisma.profile.findUnique({
            where: {
                userId: user.id,
            },
            select: {
                id: true,
            },
        });
        if (!profile) {
            return NextResponse.json(
                { error: "Profile not found." },
                { status: 404 },
            );
        }

        // Feature searches store their category; global searches leave the
        // enum unset (the column stays NULL in the database).
        const searchHistory = await prisma.searchHistory.create({
            data: isGlobal
                ? {
                      title,
                      type: undefined,
                      isGlobal,
                      searchedOwner: { connect: { id: profile.id } },
                  }
                : {
                      title,
                      type: type as SearchHistoryRequest["type"],
                      isGlobal,
                      searchedOwner: { connect: { id: profile.id } },
                  },
            select: {
                id: true,
                title: true,
                type: true,
                isGlobal: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ searchHistory }, { status: 201 });
    } catch (error) {
        // Failed authentication surfaces as an ApiError from the auth service;
        // report it as unauthorized rather than a generic failure.
        if (error instanceof ApiError) {
            return NextResponse.json(
                { error: "Authentication failed." },
                { status: error.status },
            );
        }
        console.error("[api/search] failed to record search history:", error);
        return NextResponse.json(
            { error: "Could not save the search history." },
            { status: 503 },
        );
    }
}


type DeleteSearchHistoryRequest = {
    id?: string | number;
    all?: boolean;
}

/**
 * Deletes saved search history for the authenticated user's profile — either
 * a single entry by id, or every entry at once when `all` is true.
 */
export async function DELETE(request: NextRequest) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Request body must be valid JSON." },
            { status: 400 }
        );
    }

    const data = body as Partial<DeleteSearchHistoryRequest> | null;
    const { id, all } = data ?? {};

    if (all !== undefined && typeof all !== "boolean") {
        return NextResponse.json(
            { error: "'all' must be a boolean." },
            { status: 400 }
        );
    }
    if (id !== undefined) {
        const numericId = typeof id === "number" ? id : Number(String(id));
        if (
            (typeof id !== "string" && typeof id !== "number") ||
            !Number.isInteger(numericId) ||
            numericId < 1
        ) {
            return NextResponse.json(
                { error: "'id' must be a positive integer." },
                { status: 400 }
            );
        }
    }
    if (id === undefined && all !== true) {
        return NextResponse.json(
            { error: "Either 'id' or 'all' must be provided." },
            { status: 400 }
        );
    }

    try {
        const user = await getCurrentUser({
            headers: { Cookie: request.headers.get("cookie") ?? "" },
        });
        const profile = await prisma.profile.findUnique({
            where: {
                userId: user.id,
            },
            select: {
                id: true,
            },
        });
        if (!profile) {
            return NextResponse.json(
                { error: "Profile not found." },
                { status: 404 }
            );
        }

        if (all) {
            const deleted = await prisma.searchHistory.deleteMany({
                where: {
                    searchedOwner: {
                        userId: profile.id,
                    },
                },
            });
            return NextResponse.json({
                message: `Deleted ${deleted.count} search histor${deleted.count === 1 ? "y" : "ies"}.`,
            });
        }

        const deleted = await prisma.searchHistory.deleteMany({
            where: {
                id: Number(id),
                searchedOwner: {
                    userId: profile.id,
                },
            },
        });
        if (deleted.count === 0) {
            return NextResponse.json(
                { error: "Search history entry not found." },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Search history deleted successfully." }
        );
    }
    catch (error) {
        // Failed authentication surfaces as an ApiError from the auth service;
        // report it as unauthorized rather than a generic failure.
        if (error instanceof ApiError) {
            return NextResponse.json(
                { error: "Authentication failed." },
                { status: error.status }
            );
        }
        console.error("[api/search] failed to delete search history:", error);
        return NextResponse.json(
            { error: "Could not delete the search history." },
            { status: 503 }
        );
    }
}

