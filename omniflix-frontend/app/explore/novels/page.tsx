"use client";

import { useCallback, useState } from "react";
import { ExploreLayout } from "@/components/layouts/explore/ExploreLayout";
import { FeaturedNovelSection } from "@/components/layouts/novels/FeaturedNovelSection";
import { PopularNovelsCarousel } from "@/components/layouts/novels/PopularNovelsCarousel";
import { BrowseNovelsSection } from "@/components/layouts/novels/BrowseNovelsSection";
import { NovelsSidebar } from "@/components/layouts/novels/NovelsSidebar";
import { SearchResultSection } from "@/components/SearchResultsSection";
import useDebounce from "../../../lib/debounce";
import {
    dedupeById,
    NOVELS_PAGE_SIZE,
    useNovelSearch,
    useNovels,
    usePopularNovels,
} from "@/components/layouts/novels/novelsQueries";

export default function NovelsPage() {
    const novelsQuery = useNovels();
    // Same novel id re-served across pages is a duplicate; exact ids are not.
    const novels = dedupeById(
        novelsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    );

    const popularNovels = novelsQuery.data?.pages.flatMap((page) => page.items) ?? [];

    const popularQuery = usePopularNovels();
    // Popularity-ranked feed, falling back to the catalog head if the
    // popular endpoint cannot be reached.
    const carouselItems = popularQuery.data ??
        (popularQuery.isError ? novels.slice(0, NOVELS_PAGE_SIZE) : []);

    const featuredItem = novels[0];

    // Search state — the exact Movies/Series page pattern: controlled input,
    // debounced query, per-query cached search request.
    const [searchQuery, setSearchQuery] = useState("");
    const trimmedQuery = searchQuery.trim();
    const debouncedQuery = useDebounce(trimmedQuery, 400);

    const isSearchMode = trimmedQuery.length > 0;

    const novelSearchQuery = useNovelSearch(debouncedQuery);

    const handleSearchSubmit = useCallback((query: string) => {
        setSearchQuery(query.trim());
    }, []);

    const handleBackToBrowse = useCallback(() => {
        setSearchQuery("");
    }, []);

    const isSearchLoading =
        isSearchMode &&
        (debouncedQuery !== trimmedQuery ||
            novelSearchQuery.isFetching ||
            novelSearchQuery.isPending);

    const displayedResults =
        debouncedQuery === trimmedQuery ? (novelSearchQuery.data ?? []) : [];

    const searchErrorMessage =
        novelSearchQuery.error instanceof Error
            ? novelSearchQuery.error.message
            : undefined;

    const sidebar = NovelsSidebar({
        popularNovels,
        error: novelsQuery.isError
            ? "Novel providers could not be loaded."
            : undefined,
        searchQuery,
        onSearchChange: setSearchQuery,
        onSearchSubmit: handleSearchSubmit,
    });

    const errorMessage =
        novelsQuery.error instanceof Error
            ? novelsQuery.error.message
            : undefined;
    const refetch = () => novelsQuery.refetch();

    return (
        <ExploreLayout
            utilities={sidebar.utilities}
            popular={sidebar.popular}
        >
            {/* No <main> wrapper here: ExploreLayout's main already provides
                the page padding (px-4 py-6 sm:px-6 lg:px-8 lg:py-8), matching
                Comics. An extra wrapper double-applies it. */}
            <header className="mb-6">
                <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[#F5F5F5] sm:text-3xl">
                    Novels
                </h1>
                <p className="mt-1 text-sm text-[#A1A1AA]">
                    Discover light novels and translated web novels.
                </p>
            </header>

            {isSearchMode ? (
                <SearchResultSection
                    submittedQuery={trimmedQuery}
                    sourceHeading="Novels"
                    catalogItems={displayedResults}
                    catalogQuery={{
                        isPending: isSearchLoading,
                        isFetching: isSearchLoading,
                        hasNextPage: false,
                        isFetchingNextPage: false,
                        error: searchErrorMessage,
                        refetch: () => novelSearchQuery.refetch(),
                    }}
                    onClearSearch={handleBackToBrowse}
                />
            ) : (
            <>
            <FeaturedNovelSection
                isPending={novelsQuery.isPending}
                isError={novelsQuery.isError}
                errorMessage={errorMessage}
                onRetry={refetch}
                featuredItem={featuredItem}
            />

            <PopularNovelsCarousel
                items={carouselItems}
                isPending={popularQuery.isPending && !carouselItems.length}
            />

            <BrowseNovelsSection
                isPending={novelsQuery.isPending}
                isError={novelsQuery.isError}
                errorMessage={errorMessage}
                onRetry={refetch}
                novels={novels}
                hasNextPage={novelsQuery.data ? novelsQuery.hasNextPage : false}
                isFetchingNextPage={novelsQuery.isFetchingNextPage}
                onLoadMore={() => novelsQuery.fetchNextPage()}
            />
            </>
            )}
        </ExploreLayout>
    );
}
