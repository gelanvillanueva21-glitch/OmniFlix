import { NextRequest, NextResponse } from "next/server";
import { searchJikanAnime } from "@/service/jikan.service";
import { searchLncrawlNovels } from "@/service/lncrawl.service";
import { searchSuwayomiComics } from "@/service/suwayomi.service";
import { searchTmdbMovies, searchTmdbTv } from "@/service/tmdb.service";
import { uniqueMediaItems } from "@/service/provider-client.service";
import type { MediaItem } from "@/lib/media";

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
