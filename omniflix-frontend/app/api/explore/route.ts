import { NextResponse } from "next/server";
import { getJikanAnime } from "@/service/jikan/jikan.service";
import { getLncrawlNovels } from "@/service/lncrawl/lncrawl.service";
import { getSuwayomiComics } from "@/service/suwayomi/suwayomi.service";
import { getTmdbMedia } from "@/service/tmdb/tmdb.service";
import { uniqueMediaItems } from "@/service/provider-client.service";
import type { ExploreData } from "@/lib/explore";
import type { Genre, MediaItem } from "@/lib/media";

interface ProviderResult<T> { items: T; error?: string; }

export async function GET() {
    // Novels come exclusively from the LNcrawl server (Kavita is retired
    // as a novel source; the service file stays for potential other uses).
    const [comics, lncrawlNovels, tmdb, anime] = await Promise.all([
        settleList(getSuwayomiComics()),
        settleList(getLncrawlNovels().then((page) => page.items)),
        settleMedia(getTmdbMedia()),
        settleList(getJikanAnime()),
    ]);

    const novels = uniqueMediaItems(lncrawlNovels.items);
    const movies = tmdb.items.movies;
    const series = uniqueMediaItems(
        [
            ...tmdb.items.series,
            ...anime.items
        ]
    );
    const allItems = uniqueMediaItems(
        [
            ...comics.items,
            ...novels,
            ...movies,
            ...series
        ]);

    const response: ExploreData = {
        featured: allItems[0] ?? null,
        trending: allItems.slice(0, 12),
        recommended: allItems.slice(12, 24),
        genres: createGenres(allItems),
        discover: allItems,
        popular: {
            comics: comics.items,
            novels,
            movies,
            series
        },
        errors: {
            comics: comics.error,
            lncrawl: lncrawlNovels.error,
            tmdb: tmdb.error,
            jikan: anime.error,
        },
    };

    return NextResponse.json(response);
}

async function settleList<T>(
    promise: Promise<T[]>
): Promise<ProviderResult<T[]>> {
    try {
        return { items: await promise };
    } catch (error) {
        return {
            items: [],
            // Provider error messages can embed internal hostnames/URLs; log
            // server-side and send a generic message to the browser.
            error: logAndSummarize(error),
        };
    }
}

async function settleMedia(
    promise: Promise<{
        movies: MediaItem[];
        series: MediaItem[]
    }>,
): Promise<ProviderResult<{
    movies: MediaItem[];
    series: MediaItem[]
}>> {
    try {
        return { items: await promise };
    } catch (error) {
        return {
            items: { movies: [], series: [] },
            error: logAndSummarize(error),
        };
    }
}

function logAndSummarize(error: unknown): string {
    if (error instanceof Error) {
        console.error("[api/explore] provider failed:", error.message);
    }
    return "A content provider is unavailable right now.";
}

function createGenres(mediaItems: MediaItem[]): Genre[] {
    const labels = new Set(mediaItems.flatMap((item) => item.genres ?? []));

    return [...labels]
        .sort()
        .slice(0, 12)
        .map((label) => ({
            id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            label,
        }));
}
