"use client";

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
import { ExploreContentSkeleton } from "@/components/explore/ExploreLoadingSkeleton";
import {
    LoadingSkeleton,
    MediaRowSkeleton,
} from "@/components/explore/LoadingSkeleton";
import { CatalogResultGrid } from "@/components/comics/CatalogResultGrid";
import { LoadMoreControl } from "@/components/comics/LoadMoreControl";
import { SourceSelector } from "@/components/comics/SourceSelector";
import {
    useComicsBrowseState,
    useComicsCatalog,
    useComicsSources,
} from "@/components/comics/useComicsCatalog";
import type { MediaItem } from "@/lib/media";

function errorMessage(error: unknown): string | undefined {
    return error instanceof Error ? error.message : undefined;
}

export default function ComicsPage() {
    const sourcesQuery = useComicsSources();

    // Default to the first English source; fall back to the first available.
    const sources = sourcesQuery.data?.sources ?? [];
    const defaultSourceId =
        sources.find((source) => source.lang === "en")?.id ?? sources[0]?.id;

    const {
        activeSourceId,
        submittedQuery,
        isSearchMode,
        browsePage,
        setSelectedSourceId,
        setBrowsePage,
        handleSearchSubmit,
        handleClearSearch,
    } = useComicsBrowseState(defaultSourceId ?? null);

    const catalogQuery = useComicsCatalog(
        activeSourceId,
        browsePage,
        isSearchMode ? "SEARCH" : "POPULAR",
        submittedQuery,
        isSearchMode,
    );

    const catalogItems = catalogQuery.data?.items ?? [];
    const featuredItem = catalogItems[0];
    const carouselItems = catalogItems.slice(0, 12);

    if (sourcesQuery.isPending) {
        return (
            <ExploreLayout>
                <ExploreContentSkeleton />
            </ExploreLayout>
        );
    }

    if (sourcesQuery.isError) {
        return (
            <ExploreLayout>
                <ErrorState
                    message={
                        sourcesQuery.error instanceof Error
                            ? sourcesQuery.error.message
                            : "Suwayomi is unreachable."
                    }
                    onRetry={() => sourcesQuery.refetch()}
                />
            </ExploreLayout>
        );
    }

    if (sources.length === 0) {
        return (
            <ExploreLayout>
                <EmptyState
                    title="No comic sources installed"
                    description="Suwayomi reports no installed extensions. Install a comic extension in the Suwayomi dashboard, then reload this page."
                />
            </ExploreLayout>
        );
    }

    const activeSource = sources.find((source) => source.id === activeSourceId);
    const sourceHeading = activeSource?.displayName ?? "source";

    return (
        <ExploreLayout
            utilities={
                <div className="space-y-5">
                    <SearchBar
                        id="comics-search"
                        placeholder={`Search ${sourceHeading}…`}
                        onSubmit={handleSearchSubmit}
                    />
                    <SourceSelector
                        sources={sources}
                        selectedId={activeSourceId}
                        onSelect={setSelectedSourceId}
                    />
                    <PopularContentList
                        title={`Popular on ${sourceHeading}`}
                        items={carouselItems}
                    />
                </div>
            }
        >
            <header className="mb-6">
                <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[#F5F5F5] sm:text-3xl">
                    Comics
                </h1>
                <p className="mt-1 text-sm text-[#A1A1AA] sm:text-base">
                    Browse manga from your installed Suwayomi sources.
                </p>
            </header>

            {isSearchMode ? (
                <SearchResultsSection
                    submittedQuery={submittedQuery}
                    sourceHeading={sourceHeading}
                    catalogItems={catalogItems}
                    catalogQuery={catalogQuery}
                    browsePage={browsePage}
                    onClearSearch={handleClearSearch}
                    onLoadMore={() => setBrowsePage((page) => page + 1)}
                />
            ) : (
                <BrowseSections
                    sourceHeading={sourceHeading}
                    catalogItems={catalogItems}
                    carouselItems={carouselItems}
                    featuredItem={featuredItem}
                    catalogQuery={catalogQuery}
                    browsePage={browsePage}
                    onLoadMore={() => setBrowsePage((page) => page + 1)}
                />
            )}
        </ExploreLayout>
    );
}

interface CatalogSectionProps {
    sourceHeading: string;
    catalogItems: MediaItem[];
    catalogQuery: ReturnType<typeof useComicsCatalog>;
    browsePage: number;
    onLoadMore: () => void;
}

function SearchResultsSection({
    submittedQuery,
    sourceHeading,
    catalogItems,
    catalogQuery,
    browsePage,
    onClearSearch,
    onLoadMore,
}: CatalogSectionProps & {
    submittedQuery: string;
    onClearSearch: () => void;
}) {
    return (
        <section aria-label="Search results" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <SectionHeader title={`Results for “${submittedQuery}”`} />
                <button
                    type="button"
                    onClick={onClearSearch}
                    className="rounded text-sm font-medium text-[#A1A1AA] transition-colors hover:text-[#A78BFA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                >
                    Clear search
                </button>
            </div>
            <CatalogResultGrid
                items={catalogItems}
                isPending={catalogQuery.isPending}
                isFetching={catalogQuery.isFetching}
                error={errorMessage(catalogQuery.error)}
                onRetry={() => catalogQuery.refetch()}
                emptyDescription={`No results found on ${sourceHeading} for “${submittedQuery}”.`}
            />
            <LoadMoreControl
                hasNextPage={catalogQuery.data?.hasNextPage ?? false}
                isFetchingNextPage={catalogQuery.isFetching && browsePage > 1}
                onLoadMore={onLoadMore}
            />
        </section>
    );
}

function BrowseSections({
    sourceHeading,
    catalogItems,
    carouselItems,
    featuredItem,
    catalogQuery,
    browsePage,
    onLoadMore,
}: CatalogSectionProps & {
    carouselItems: MediaItem[];
    featuredItem: MediaItem | undefined;
}) {
    return (
        <>
            {/* Featured: first item of the source's popular catalog. */}
            <section aria-label="Featured comic" className="mb-8">
                {catalogQuery.isPending ? (
                    <LoadingSkeleton className="aspect-12/5 w-full" />
                ) : catalogQuery.isError ? (
                    <ErrorState
                        message={errorMessage(catalogQuery.error)}
                        onRetry={() => catalogQuery.refetch()}
                    />
                ) : featuredItem ? (
                    <MediaCard media={featuredItem} variant="wide" />
                ) : (
                    <EmptyState
                        title="No comics returned"
                        description={
                            `${sourceHeading} returned an empty catalog. ` +
                            "Try another source."
                        }
                    />
                )}
            </section>

            <section aria-label="Popular comics" className="mb-8 space-y-4">
                <SectionHeader title={`Popular on ${sourceHeading}`} />
                {catalogQuery.isPending ? (
                    <MediaRowSkeleton />
                ) : (
                    <MediaCarousel
                        items={carouselItems}
                        label={`Popular on ${sourceHeading}`}
                    />
                )}
            </section>

            <section aria-label="Browse comics" className="space-y-4">
                <SectionHeader title={`Browse ${sourceHeading}`} />
                <CatalogResultGrid
                    items={catalogItems}
                    isPending={catalogQuery.isPending}
                    isFetching={catalogQuery.isFetching}
                    error={errorMessage(catalogQuery.error)}
                    onRetry={() => catalogQuery.refetch()}
                    emptyDescription={
                        `${sourceHeading} returned no comics yet. ` +
                        "Try another source."
                    }
                />
                <LoadMoreControl
                    hasNextPage={catalogQuery.data?.hasNextPage ?? false}
                    isFetchingNextPage={catalogQuery.isFetching && browsePage > 1}
                    onLoadMore={onLoadMore}
                />
            </section>
        </>
    );
}
