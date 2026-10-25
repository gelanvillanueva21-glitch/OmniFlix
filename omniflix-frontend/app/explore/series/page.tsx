"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExploreLayout } from "@/components/explore/ExploreLayout";
import { FeaturedSeriesSection } from "@/components/series/FeaturedSeriesSection";
import { PopularCarouselSection } from "@/components/series/PopularCarouselSection";
import { BrowseSeriesSection } from "@/components/series/BrowseSeriesSection";
import { SearchResultSection } from "@/components/comics/SearchResultSection";
import { SeriesSidebar } from "@/components/series/SeriesSidebar";
import {
    dedupeById,
    searchDualSeries,
    usePopularAnime,
    usePopularSeries,
    useSeriesBrowse,
} from "@/components/series/seriesQueries";

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
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

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const trimmedQuery = searchQuery.trim();
    const debouncedQuery = useDebounce(trimmedQuery, 400);

    const isSearchMode = trimmedQuery.length > 0;

    const seriesSearchQuery = useQuery({
        queryKey: ["series", "search", debouncedQuery],
        queryFn: () => searchDualSeries(debouncedQuery),
        enabled: isSearchMode && debouncedQuery.length > 0,
        staleTime: 60 * 1000,
    });

    const handleSearchSubmit = useCallback((query: string) => {
        setSearchQuery(query.trim());
    }, []);

    const handleBackToBrowse = useCallback(() => {
        setSearchQuery("");
    }, []);

    const isSearchLoading =
        isSearchMode &&
        (debouncedQuery !== trimmedQuery ||
            seriesSearchQuery.isFetching ||
            seriesSearchQuery.isPending);

    const displayedResults =
        debouncedQuery === trimmedQuery
            ? (seriesSearchQuery.data?.results ?? [])
            : [];

    const searchErrorMessage =
        seriesSearchQuery.error instanceof Error
            ? seriesSearchQuery.error.message
            : seriesSearchQuery.data?.error;

    const sidebar = SeriesSidebar({
        popularSeries,
        popularAnime,
        seriesError: seriesSidebarQuery.isError
            ? "TMDB could not be loaded."
            : undefined,
        animeError: animeSidebarQuery.isError
            ? "Jikan could not be loaded."
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
            <header className="mb-6">
                <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[#F5F5F5] sm:text-3xl">
                    Series
                </h1>
                <p className="mt-1 text-sm text-[#A1A1AA]">
                    Discover popular TV series from TMDB and anime from Jikan.
                </p>
            </header>

            {isSearchMode ? (
                <SearchResultSection
                    submittedQuery={trimmedQuery}
                    sourceHeading="Series"
                    catalogItems={displayedResults}
                    catalogQuery={{
                        isPending: isSearchLoading,
                        isFetching: isSearchLoading,
                        hasNextPage: false,
                        isFetchingNextPage: false,
                        error: searchErrorMessage,
                        refetch: () => seriesSearchQuery.refetch(),
                    }}
                    onClearSearch={handleBackToBrowse}
                />
            ) : (
                <>
                    {/* Featured content: same wide-card pattern as the Movies page. */}
                    <FeaturedSeriesSection
                        isPending={isPending}
                        isError={isError}
                        errorMessage={
                            queryError instanceof Error
                                ? queryError.message
                                : undefined
                        }
                        onRetry={refetch}
                        featuredSeries={featuredSeries}
                    />

                    {/* Popular carousels — one per provider, matching the Movies page. */}
                    <PopularCarouselSection
                        label="Popular shows"
                        title="Popular Shows"
                        isPending={seriesSidebarQuery.isPending}
                        isError={seriesSidebarQuery.isError}
                        errorMessage={
                            seriesSidebarQuery.error instanceof Error
                                ? seriesSidebarQuery.error.message
                                : undefined
                        }
                        onRetry={() => seriesSidebarQuery.refetch()}
                        items={popularSeries}
                    />
                    <PopularCarouselSection
                        label="Popular anime"
                        title="Popular Anime"
                        isPending={animeSidebarQuery.isPending}
                        isError={animeSidebarQuery.isError}
                        errorMessage={
                            animeSidebarQuery.error instanceof Error
                                ? animeSidebarQuery.error.message
                                : undefined
                        }
                        onRetry={() => animeSidebarQuery.refetch()}
                        items={popularAnime}
                    />

                    {/* Single combined browse grid: TMDB series + Jikan anime mixed. */}
                    <BrowseSeriesSection
                        isPending={isPending}
                        isError={isError}
                        errorMessage={
                            queryError instanceof Error
                                ? queryError.message
                                : undefined
                        }
                        onRetry={refetch}
                        browseItems={browseItems}
                        hasProviderError={
                            browseQuery.data?.pages.some(
                                (page) => page.providerError,
                            ) ?? false
                        }
                        hasNextPage={
                            browseQuery.data ? browseQuery.hasNextPage : false
                        }
                        isFetchingNextPage={browseQuery.isFetchingNextPage}
                        onLoadMore={() => browseQuery.fetchNextPage()}
                    />
                </>
            )}
        </ExploreLayout>
    );
}
