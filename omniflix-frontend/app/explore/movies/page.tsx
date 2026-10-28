"use client";

import { useCallback, useState } from "react";
import { ExploreLayout } from "@/components/explore/ExploreLayout";
import { FeaturedMovieSection } from "@/components/movies/FeaturedMovieSection";
import { PopularMoviesCarousel } from "@/components/movies/PopularMoviesCarousel";
import { BrowseMoviesSection } from "@/components/movies/BrowseMoviesSection";
import { MoviesSidebar } from "@/components/movies/MoviesSidebar";
import { SearchResultSection } from "@/components/comics/SearchResultSection";
import useDebounce from "../../../lib/debounce";
import {
    dedupeById,
    POPULAR_MOVIES_LIMIT,
    useMovieSearch,
    usePopularMovies,
    usePopularMoviesBrowse,
} from "@/components/movies/moviesQueries";

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

    // Search state — the exact Series page pattern: controlled input, debounced
    // query, per-query cached search request.
    const [searchQuery, setSearchQuery] = useState("");
    const trimmedQuery = searchQuery.trim();
    const debouncedQuery = useDebounce(trimmedQuery, 400);

    const isSearchMode = trimmedQuery.length > 0;

    const movieSearchQuery = useMovieSearch(debouncedQuery);

    const handleSearchSubmit = useCallback((query: string) => {
        setSearchQuery(query.trim());
    }, []);

    const handleBackToBrowse = useCallback(() => {
        setSearchQuery("");
    }, []);

    const isSearchLoading =
        isSearchMode &&
        (debouncedQuery !== trimmedQuery ||
            movieSearchQuery.isFetching ||
            movieSearchQuery.isPending);

    const displayedResults =
        debouncedQuery === trimmedQuery ? (movieSearchQuery.data ?? []) : [];

    const searchErrorMessage =
        movieSearchQuery.error instanceof Error
            ? movieSearchQuery.error.message
            : undefined;

    const sidebar = MoviesSidebar({
        popularMovies: popularMovie,
        error: sidebarQuery.isError
            ? "Movie providers could not be loaded."
            : undefined,
        searchQuery,
        onSearchChange: setSearchQuery,
        onSearchSubmit: handleSearchSubmit,
    });

    return (
        <ExploreLayout
            utilities={sidebar.utilities}
            popular={sidebar.popular}
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

            {isSearchMode ? (
                <SearchResultSection
                    submittedQuery={trimmedQuery}
                    sourceHeading="Movies"
                    catalogItems={displayedResults}
                    catalogQuery={{
                        isPending: isSearchLoading,
                        isFetching: isSearchLoading,
                        hasNextPage: false,
                        isFetchingNextPage: false,
                        error: searchErrorMessage,
                        refetch: () => movieSearchQuery.refetch(),
                    }}
                    onClearSearch={handleBackToBrowse}
                />
            ) : (
            <>
            <FeaturedMovieSection
                isPending={isPending}
                isError={isError}
                errorMessage={
                    queryError instanceof Error ? queryError.message : undefined
                }
                onRetry={refetch}
                featuredMovie={featuredMovie}
            />

            <PopularMoviesCarousel items={carouselItems} isPending={isPending} />

            <BrowseMoviesSection
                isPending={isPending}
                isError={isError}
                errorMessage={
                    queryError instanceof Error ? queryError.message : undefined
                }
                onRetry={refetch}
                browseMovies={browseMovies}
                hasNextPage={browseQuery.data ? browseQuery.hasNextPage : false}
                isFetchingNextPage={browseQuery.isFetchingNextPage}
                onLoadMore={() => browseQuery.fetchNextPage()}
            />
            </>
            )}
        </ExploreLayout>
    );
}
