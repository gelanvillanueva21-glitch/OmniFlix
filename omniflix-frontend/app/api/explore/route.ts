import { NextResponse } from "next/server";
import { getJikanAnime } from "@/service/jikan.service";
import { getKavitaSeries } from "@/service/kavita.service";
import { getLncrawlNovels } from "@/service/lncrawl.service";
import { getSuwayomiComics } from "@/service/suwayomi.service";
import { getTmdbMedia } from "@/service/tmdb.service";
import { uniqueMediaItems } from "@/service/provider-client.service";
import type { ExploreData } from "@/lib/explore";
import type { Genre, MediaItem } from "@/lib/media";

interface ProviderResult<T> { items: T; error?: string; }

export async function GET() {
    const [comics, lncrawlNovels, kavitaNovels, tmdb, anime] = await Promise.all([
        settleList(getSuwayomiComics()),
        settleList(getLncrawlNovels()),
        settleList(getKavitaSeries()),
        settleMedia(getTmdbMedia()),
        settleList(getJikanAnime()),
    ]);

    const novels = uniqueMediaItems(
        [
            ...lncrawlNovels.items, 
            ...kavitaNovels.items
        ]
    );
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
            kavita: kavitaNovels.error,
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
            error: error instanceof Error ? 
                error.message : "Provider failed.",
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
            error: error instanceof Error ? 
                error.message : "Provider failed.",
        };
    }
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
