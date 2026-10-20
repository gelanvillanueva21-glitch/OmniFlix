"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
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
import { COMICK_SOURCE_TYPE } from "@/service/suwayomi.service";

interface ComicsPageProps {
    sourceType: string;
}

function errorMessage(error: unknown): string | undefined {
    return error instanceof Error ? error.message : undefined;
}

export function ComicsPage({ sourceType }: ComicsPageProps) {
    const router = useRouter();
    const onSelectSource = useCallback(
        (type: string) => router.push(`/explore/comics/${type}`),
        [router],
    );

    return (
        <ComicsPageContent
            key={sourceType}
            sourceType={sourceType}
            onSelectSource={onSelectSource}
        />
    );
}

function ComicsPageContent({
    sourceType,
    onSelectSource,
}: ComicsPageProps & { onSelectSource: (type: string) => void }) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const sourcesQuery = useComicsSources();
    const sources = sourcesQuery.data?.sources ?? [];
    const isAdmin = user?.role.trim().toLowerCase() === "admin";
    const visibleSources = sources.filter(
        (source) => isAdmin || source.type !== COMICK_SOURCE_TYPE,
    );

    useEffect(() => {
        if (
            !isAuthLoading &&
            sourceType === COMICK_SOURCE_TYPE &&
            !isAdmin
        ) {
            onSelectSource("asura-scans");
        }
    }, [isAdmin, isAuthLoading, onSelectSource, sourceType]);

    const {
        activeSourceType,
        submittedQuery,
        isSearchMode,
        browsePage,
        setBrowsePage,
        handleSearchSubmit,
        handleClearSearch,
    } = useComicsBrowseState(sourceType);

    const activeSource = visibleSources.find(
        (source) => source.type === activeSourceType,
    );
    const catalogQuery = useComicsCatalog(
        activeSource?.type ?? null,
        browsePage,
        isSearchMode ? "SEARCH" : "POPULAR",
        submittedQuery,
        isSearchMode,
    );

    const catalogItems = catalogQuery.data?.items ?? [];
    const visibleCatalogItems = catalogItems;
    const featuredItem = visibleCatalogItems[0];
    const carouselItems = visibleCatalogItems.slice(0, 12);

    if (isAuthLoading && sourceType === COMICK_SOURCE_TYPE) {
        return (
            <ExploreLayout>
                <ExploreContentSkeleton />
            </ExploreLayout>
        );
    }

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

    if (visibleSources.length === 0) {
        return (
            <ExploreLayout>
                <EmptyState
                    title="No comic sources installed"
                    description="Suwayomi reports no installed extensions. Install a comic extension in the Suwayomi dashboard, then reload this page."
                />
            </ExploreLayout>
        );
    }

    if (!activeSource) {
        return (
            <ExploreLayout>
                <ErrorState message={`Unsupported comic source: ${sourceType}`} />
            </ExploreLayout>
        );
    }

    const sourceHeading = activeSource.displayName;

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
                        sources={visibleSources}
                        selectedType={activeSource.type}
                        onSelect={onSelectSource}
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
                    catalogItems={visibleCatalogItems}
                    catalogQuery={catalogQuery}
                    browsePage={browsePage}
                    onClearSearch={handleClearSearch}
                    onLoadMore={() => setBrowsePage((page) => page + 1)}
                />
            ) : (
                <BrowseSections
                    sourceHeading={sourceHeading}
                    catalogItems={visibleCatalogItems}
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
            <section aria-label="Featured comic" className="mb-8">
                {catalogQuery.isPending ? (
                    <LoadingSkeleton className="aspect-12/5 w-full" />
                ) : catalogQuery.isError ? (
                    <ErrorState
                        message={errorMessage(catalogQuery.error)}
                        onRetry={() => catalogQuery.refetch()}
                    />
                ) : featuredItem ? (
                    <MediaCard
                        media={featuredItem}
                        variant="wide"
                    />
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
