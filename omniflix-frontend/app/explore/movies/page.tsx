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
import type { MediaItem } from "@/lib/media";
import { LoadMoreControl } from "@/components/comics/LoadMoreControl";

const POPULAR_MOVIES_API = "/api/tmdb/popular-movies";
const POPULAR_MOVIES_LIMIT = 12;

interface PopularMoviesResponse {
    items: MediaItem[];
    hasNextPage: boolean;
}

async function fetchPopularMoviesPage(page: number): Promise<PopularMoviesResponse> {
    const search = new URLSearchParams({
        limit: String(POPULAR_MOVIES_LIMIT),
        page: String(page),
    });
    const response = await fetch(`${POPULAR_MOVIES_API}?${search.toString()}`);
    const payload = (await response.json()) as
        | PopularMoviesResponse
        | { error: string };
    if (!response.ok || !("items" in payload)) {
        throw new Error(
            ("error" in payload && payload.error) ||
                "TMDB is unavailable right now.",
        );
    }
    return payload;
}

/** Same movie id on consecutive pages is a duplicate; exact ids are not. */
function dedupeById(items: MediaItem[]): MediaItem[] {
    return [...new Map(items.map((item) => [item.id, item])).values()];
}

/**
 * Browse-content pagination: appends TMDB pages via the infinite-query
 * pattern shared with the Novels feature.
 */
export function usePopularMoviesBrowse() {
    return useInfiniteQuery({
        queryKey: ["movies", "popular", "browse"],
        queryFn: ({ pageParam }) => fetchPopularMoviesPage(pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) =>
            lastPage.hasNextPage ? allPages.length + 1 : undefined,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Sidebar popular content keeps its own page-1 query — the exact Comics
 * pattern — so browse pagination can never overwrite it.
 */
export function usePopularMovies() {
    return useQuery({
        queryKey: ["movies", "popular", "sidebar"],
        queryFn: () => fetchPopularMoviesPage(1),
        staleTime: 5 * 60 * 1000,
    });
}

export default function MoviesPage() {
    const browseQuery = usePopularMoviesBrowse();
    // Browse content: pages appended, deduped like the Novels feature.
    const browseMovies = dedupeById(
        browseQuery.data?.pages.flatMap((page) => page.items) ?? [],
    );

    // Sidebar has its own query; untouched by browse pagination.
    const sidebarQuery = usePopularMovies();
    const popularMovie = sidebarQuery.data?.items ?? [];

    
    const featuredMovie = browseMovies[0];
    const carouselItems = browseMovies.slice(0, POPULAR_MOVIES_LIMIT);

    const isPending = browseQuery.isPending;
    const isError = browseQuery.isError;
    const queryError = browseQuery.error;
    const refetch = () => browseQuery.refetch();

    return (
        <ExploreLayout
            utilities={
                <SearchBar id="movies-search" placeholder="Search movies…" />
            }
            popular={
                <PopularContentList
                    title="Popular Movies"
                    items={popularMovie}
                    error={
                        sidebarQuery.isError
                            ? "Movie providers could not be loaded."
                            : undefined
                    }
                />
            }
        >
            {/* No <main> wrapper here: ExploreLayout's main already provides
                the page padding, matching Comics and Explore. */}
            <header className="mb-6">
                <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[#F5F5F5] sm:text-3xl">
                    Movies
                </h1>
                <p className="mt-1 text-sm text-[#A1A1AA]">
                    Discover popular movies from TMDB.
                </p>
            </header>

            <section aria-label="Featured movie" className="mb-8">
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
                ) : featuredMovie ? (
                    <MediaCard media={featuredMovie} variant="wide" />
                ) : (
                    <EmptyState
                        title="No movies returned"
                        description="TMDB returned no popular movies right now."
                    />
                )}
            </section>

            <section aria-label="Popular movies carousel" className="mb-8 space-y-4">
                <SectionHeader title="Popular Movies" />
                {isPending ? (
                    <MediaRowSkeleton />
                ) : (
                    <MediaCarousel
                        items={carouselItems}
                        label="Popular Movies"
                    />
                )}
            </section>

            <section aria-label="Browse movies" className="space-y-4">
                <SectionHeader title="Browse Movies" />
                {isPending ? (
                    <div
                        role="status"
                        aria-label="Loading movies"
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
                ) : isError ? (
                    <ErrorState
                        message={
                            queryError instanceof Error
                                ? queryError.message
                                : undefined
                        }
                        onRetry={() => refetch()}
                    />
                ) : browseMovies.length === 0 ? (
                    <EmptyState
                        title="Nothing here yet"
                        description="No popular movies are available right now."
                    />
                ) : (
                    <ul
                        role="list"
                        className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
                    >
                        {browseMovies.map((item) => (
                            <li key={item.id}>
                                <MediaCard media={item} />
                            </li>
                        ))}
                    </ul>
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
