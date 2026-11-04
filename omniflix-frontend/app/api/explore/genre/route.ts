import { NextRequest, NextResponse } from "next/server";
import {
    isGenreMediaType,
    isGenreProvider,
    genreTaxonomy,
} from "@/lib/genre";
import type { MediaItem } from "@/lib/media";
import { getJikanGenrePage, getJikanGenres } from "@/service/jikan/jikan.service";
import {
    getLncrawlGenreTags,
    getLncrawlNovelsByTag,
} from "@/service/lncrawl/lncrawl.service";
import {
    COMICK_SOURCE_TYPE,
    fetchSuwayomiGenrePage,
    getSuwayomiGenreOptions,
    getSuwayomiSources,
} from "@/service/suwayomi/suwayomi.service";
import { getTmdbGenrePage, getTmdbGenres } from "@/service/tmdb/tmdb.service";
import { isAdminRequest } from "@/service/server-auth.service";
import { uniqueMediaItems } from "@/service/provider-client.service";

const MAX_PAGE = 1000;
const TMDB_MAX_PAGE = 500;

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const provider = params.get("provider");
    const mediaType = params.get("mediaType");
    const genreId = params.get("genre");
    const sourceType = params.get("sourceType");
    const page = Number(params.get("page") ?? "1");

    if (!isGenreProvider(provider)) {
        return NextResponse.json(
            { error: "A supported provider is required." },
            { status: 400 },
        );
    }
    if (!isGenreMediaType(provider, mediaType)) {
        return NextResponse.json(
            { error: "The media type is not supported by this provider." },
            { status: 400 },
        );
    }
    if (!genreId?.trim()) {
        return NextResponse.json(
            { error: "A genre identifier is required." },
            { status: 400 },
        );
    }
    if (!Number.isSafeInteger(page) || page < 1 || page > MAX_PAGE) {
        return NextResponse.json(
            { error: `Page must be an integer between 1 and ${MAX_PAGE}.` },
            { status: 400 },
        );
    }
    if (provider === "tmdb" && page > TMDB_MAX_PAGE) {
        return NextResponse.json(
            { error: `TMDB pages cannot exceed ${TMDB_MAX_PAGE}.` },
            { status: 400 },
        );
    }
    if (
        provider === "suwayomi" &&
        (!sourceType || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sourceType))
    ) {
        return NextResponse.json(
            { error: "A supported comic source type is required." },
            { status: 400 },
        );
    }

    try {
        let items: MediaItem[];
        let hasNextPage: boolean;
        let supported = true;

        if (provider === "tmdb") {
            if (mediaType !== "movies" && mediaType !== "series") {
                return NextResponse.json(
                    { error: "The media type is not supported by this provider." },
                    { status: 400 },
                );
            }
            const genres = await getTmdbGenres(mediaType);
            if (!genres.some((genre) => genre.id === genreId)) {
                return invalidGenreResponse();
            }
            const result = await getTmdbGenrePage(
                mediaType,
                genreId,
                genres,
                page,
            );
            items = result.items;
            hasNextPage = page < Math.min(result.totalPages, TMDB_MAX_PAGE);
        } else if (provider === "jikan") {
            if (mediaType !== "anime" && mediaType !== "manga") {
                return NextResponse.json(
                    { error: "The media type is not supported by this provider." },
                    { status: 400 },
                );
            }
            const genres = await getJikanGenres(mediaType);
            if (!genres.some((genre) => genre.id === genreId)) {
                return invalidGenreResponse();
            }
            const result = await getJikanGenrePage(mediaType, genreId, page);
            items = result.items;
            hasNextPage = result.hasNextPage && page < MAX_PAGE;
        } else if (provider === "lncrawl") {
            const tags = await getLncrawlGenreTags();
            if (!tags.some((tag) => tag.id === genreId)) {
                return invalidGenreResponse();
            }
            const result = await getLncrawlNovelsByTag(genreId, page);
            items = result.items;
            hasNextPage = result.hasNextPage && page < MAX_PAGE;
        } else {
            const sources = await getSuwayomiSources();
            const source = sources.find(
                (candidate) =>
                    candidate.type === sourceType || candidate.id === sourceType,
            );
            if (!source) {
                return NextResponse.json(
                    { error: "The requested comic source is unavailable." },
                    { status: 400 },
                );
            }
            if (
                source.type === COMICK_SOURCE_TYPE &&
                !(await isAdminRequest())
            ) {
                return NextResponse.json(
                    { error: "This comic source is restricted to administrators." },
                    { status: 403 },
                );
            }

            const options = await getSuwayomiGenreOptions(source.type);
            if (!options.supported) {
                items = [];
                hasNextPage = false;
                supported = false;
            } else if (!options.genres.some((genre) => genre.id === genreId)) {
                return invalidGenreResponse();
            } else {
                const result = await fetchSuwayomiGenrePage(
                    source.type,
                    genreId,
                    page,
                );
                items = result.items;
                hasNextPage = result.hasNextPage && page < MAX_PAGE;
                supported = result.supported;
            }
        }

        return NextResponse.json({
            items: uniqueMediaItems(items),
            page,
            hasNextPage,
            supported,
            taxonomy: genreTaxonomy(provider),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[api/explore/genre] request failed:", message);
        return NextResponse.json(
            { error: "The provider could not load genre results right now." },
            { status: 502 },
        );
    }
}

function invalidGenreResponse() {
    return NextResponse.json(
        { error: "The requested genre is not available for this provider." },
        { status: 400 },
    );
}
