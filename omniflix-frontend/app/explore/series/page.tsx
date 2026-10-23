"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ExploreLayout } from "@/components/explore/ExploreLayout";
import { MediaCard } from "@/components/explore/MediaCard";
import { MediaCarousel } from "@/components/explore/MediaCarousel";
import { PopularContentList } from "@/components/explore/PopularContentList";
import { SearchBar } from "@/components/explore/SearchBar";
import {
    EmptyState,
    ErrorState,
    SectionHeader,
} from "@/components/explore/SectionHeader";
import {
    LoadingSkeleton,
    MediaRowSkeleton,
} from "@/components/explore/LoadingSkeleton";
import { LoadMoreControl } from "@/components/comics/LoadMoreControl";
import type { MediaItem } from "@/lib/media";

const TMDB_SERIES_API = "/api/tmdb/popular-tv";
const JIKAN_ANIME_API = "/api/jikan/popular-anime";
const PAGE_LIMIT = 12;

interface PopularContentResponse {
    items: MediaItem[];
    hasNextPage: boolean;
}

async function fetchContentPage(
    api: string,
    fallbackError: string,
    page: number,
): Promise<PopularContentResponse> {
    const search = new URLSearchParams({
        limit: String(PAGE_LIMIT),
        page: String(page),
    });
    const response = await fetch(`${api}?${search.toString()}`);
    const payload = (await response.json()) as
        | PopularContentResponse
        | { error: string };
    if (!response.ok || !("items" in payload)) {
        throw new Error(
            ("error" in payload && payload.error) || fallbackError,
        );
    }
    return payload;
}

const fetchSeriesPage = (page: number) =>
    fetchContentPage(TMDB_SERIES_API, "TMDB is unavailable right now.", page);
const fetchAnimePage = (page: number) =>
    fetchContentPage(JIKAN_ANIME_API, "Jikan is unavailable right now.", page);

/** Same id on consecutive pages is a duplicate; exact ids are not. */
function dedupeById(items: MediaItem[]): MediaItem[] {
    return [...new Map(items.map((item) => [item.id, item])).values()];
}

/**
 * One page of combined browse content: a TMDB series page and a Jikan anime
 * page are fetched concurrently and merged, shuffled so both providers mix
 * instead of appearing in separate blocks. Each provider keeps its own
 * request, mapping, and pagination — only the UI presentation is shared.
 */
interface CombinedBrowsePage {
    items: MediaItem[];
    /** Set when one of the two providers failed but the other succeeded. */
    providerError?: string;
    hasNextPage: boolean;
}

async function fetchCombinedBrowsePage(page: number): Promise<CombinedBrowsePage> {
    const [series, anime] = await Promise.allSettled([
        fetchSeriesPage(page),
        fetchAnimePage(page),
    ]);

    const items: MediaItem[] = [];
    const errors: string[] = [];
    if (series.status === "fulfilled") {
        items.push(...series.value.items);
    } else {
        errors.push(series.reason instanceof Error ? series.reason.message : "TMDB failed.");
    }
    if (anime.status === "fulfilled") {
        items.push(...anime.value.items);
    } else {
        errors.push(anime.reason instanceof Error ? anime.reason.message : "Jikan failed.");
    }

    if (errors.length === 2) {
        throw new Error("Both TMDB and Jikan are unavailable right now.");
    }

    const seriesSettled = series.status === "fulfilled";
    const animeSettled = anime.status === "fulfilled";

    return {
        items: shuffleItems(items),
        providerError: errors[0],
        hasNextPage:
            seriesSettled && animeSettled
                ? series.value.hasNextPage && anime.value.hasNextPage
                : seriesSettled
                  ? series.value.hasNextPage
                  : anime.status === "fulfilled" && anime.value.hasNextPage,
    };
}

/** Fisher–Yates shuffle so anime and series interleave on every page. */
function shuffleItems(items: MediaItem[]): MediaItem[] {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Combined browse pagination: appends merged TMDB + Jikan pages via the
 * infinite-query pattern shared with the Movies and Novels features.
 */
export function useSeriesBrowse() {
    return useInfiniteQuery({
        queryKey: ["series", "combined", "browse"],
        queryFn: ({ pageParam }) => fetchCombinedBrowsePage(pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) =>
            lastPage.hasNextPage ? allPages.length + 1 : undefined,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Page-1 queries — the exact Movies pattern — feed the featured card and the
 * two Popular carousels, so browse pagination can never overwrite them.
 */
export function usePopularSeries() {
    return useQuery({
        queryKey: ["series", "tmdb", "sidebar"],
        queryFn: () => fetchSeriesPage(1),
        staleTime: 5 * 60 * 1000,
    });
}

export function usePopularAnime() {
    return useQuery({
        queryKey: ["series", "jikan", "sidebar"],
        queryFn: () => fetchAnimePage(1),
        staleTime: 5 * 60 * 1000,
    });
}

export default function SeriesPage() {
    const browseQuery = useSeriesBrowse();

    const browseItems = dedupeById(
        browseQuery.data?.pages.flatMap((page) => page.items) ?? [],
    );

    // Page-1 queries feed the featured card and the popular carousels;
    // untouched by browse pagination.
    const seriesSidebarQuery = usePopularSeries();
    const animeSidebarQuery = usePopularAnime();
    const popularSeries = seriesSidebarQuery.data?.items ?? [];
    const popularAnime = animeSidebarQuery.data?.items ?? [];

    const isPending = browseQuery.isPending;
    const isError = browseQuery.isError;
    const queryError = browseQuery.error;
    const refetch = () => browseQuery.refetch();

    const featuredSeries = popularSeries[0] ?? browseItems.find(
        (item) => item.type === "series",
    );

    return (
        <ExploreLayout
            utilities={
                <SearchBar id="series-search" placeholder="Search series or anime…" />
            }
            popular={
                <>
                    <PopularContentList
                        title="Popular Series"
                        items={popularSeries}
                        error={
                            seriesSidebarQuery.isError
                                ? "TMDB could not be loaded."
                                : undefined
                        }
                    />
                    <PopularContentList
                        title="Popular Anime"
                        items={popularAnime}
                        error={
                            animeSidebarQuery.isError
                                ? "Jikan could not be loaded."
                                : undefined
                        }
                    />
                </>
            }
        >
            <header className="mb-6">
                <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[#F5F5F5] sm:text-3xl">
                    Series
                </h1>
                <p className="mt-1 text-sm text-[#A1A1AA]">
                    Discover popular TV series from TMDB and anime from Jikan.
                </p>
            </header>

            {/* Featured content: same wide-card pattern as the Movies page. */}
            <section aria-label="Featured series" className="mb-8">
                {isPending ? (
                    <LoadingSkeleton className="aspect-12/5 w-full" />
                ) : isError ? (
                    <ErrorState
                        message={
                            queryError instanceof Error
                                ? queryError.message
                                : undefined
                        }
                        onRetry={() => refetch()}
                    />
                ) : featuredSeries ? (
                    <MediaCard media={featuredSeries} variant="wide" />
                ) : (
                    <EmptyState
                        title="No series returned"
                        description="No popular series are available right now."
                    />
                )}
            </section>

            {/* Popular carousels — one per provider, matching the Movies page. */}
            <section aria-label="Popular shows" className="mb-8 space-y-4">
                <SectionHeader title="Popular Shows" />
                {seriesSidebarQuery.isPending ? (
                    <MediaRowSkeleton />
                ) : seriesSidebarQuery.isError ? (
                    <ErrorState
                        message={
                            seriesSidebarQuery.error instanceof Error
                                ? seriesSidebarQuery.error.message
                                : undefined
                        }
                        onRetry={() => seriesSidebarQuery.refetch()}
                    />
                ) : (
                    <MediaCarousel
                        items={popularSeries.slice(0, PAGE_LIMIT)}
                        label="Popular Shows"
                    />
                )}
            </section>

            <section aria-label="Popular anime" className="mb-8 space-y-4">
                <SectionHeader title="Popular Anime" />
                {animeSidebarQuery.isPending ? (
                    <MediaRowSkeleton />
                ) : animeSidebarQuery.isError ? (
                    <ErrorState
                        message={
                            animeSidebarQuery.error instanceof Error
                                ? animeSidebarQuery.error.message
                                : undefined
                        }
                        onRetry={() => animeSidebarQuery.refetch()}
                    />
                ) : (
                    <MediaCarousel
                        items={popularAnime.slice(0, PAGE_LIMIT)}
                        label="Popular Anime"
                    />
                )}
            </section>

            {/* Single combined browse grid: TMDB series + Jikan anime mixed. */}
            <section aria-label="Browse series" className="space-y-4">
                <SectionHeader title="Browse Series" />
                {isPending ? (
                    <BrowseGridSkeleton label="Loading series" />
                ) : isError ? (
                    <ErrorState
                        message={
                            queryError instanceof Error
                                ? queryError.message
                                : undefined
                        }
                        onRetry={() => refetch()}
                    />
                ) : browseItems.length === 0 ? (
                    <EmptyState
                        title="Nothing here yet"
                        description="No popular series or anime are available right now."
                    />
                ) : (
                    <>
                        {browseQuery.data &&
                            browseQuery.data.pages.some(
                                (page) => page.providerError,
                            ) && (
                                <ErrorState message="A provider failed on the last load; showing results from the other." />
                            )}
                        <ul
                            role="list"
                            className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
                        >
                            {browseItems.map((item) => (
                                <li key={item.id}>
                                    <MediaCard media={item} />
                                </li>
                            ))}
                        </ul>
                    </>
                )}
                <LoadMoreControl
                    hasNextPage={
                        browseQuery.data ? browseQuery.hasNextPage : false
                    }
                    isFetchingNextPage={browseQuery.isFetchingNextPage}
                    onLoadMore={() => browseQuery.fetchNextPage()}
                />
            </section>
        </ExploreLayout>
    );
}

function BrowseGridSkeleton({ label }: { label: string }) {
    return (
        <div
            role="status"
            aria-label={label}
            className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
        >
            {Array.from({ length: 10 }, (_, index) => (
                <div key={index} className="space-y-2">
                    <LoadingSkeleton className="aspect-2/3 w-full" />
                    <LoadingSkeleton className="h-3.5 w-3/4" />
                    <LoadingSkeleton className="h-3 w-1/2" />
                </div>
            ))}
        </div>
    );
}
