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
import { SearchResultsSection } from "@/components/comics/SearchResultsSection";
import { SourceSelector } from "@/components/comics/SourceSelector";
import {
    dedupeById,
    useComicsBrowseState,
    useComicsCatalog,
    useComicsInfiniteCatalog,
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
        handleSearchSubmit,
        handleClearSearch,
    } = useComicsBrowseState(sourceType);

    const activeSource = visibleSources.find(
        (source) => source.type === activeSourceType,
    );
    const catalogQuery = useComicsInfiniteCatalog(
        activeSource?.type ?? null,
        isSearchMode ? "SEARCH" : "POPULAR",
        submittedQuery,
        isSearchMode,
    );

    const catalogItems = dedupeById(
        catalogQuery.data?.pages.flatMap((page) => page.items) ?? [],
    );
    const firstPageItems = catalogQuery.data?.pages[0]?.items ?? [];
    const featuredItem = firstPageItems[0];
    const carouselItems = firstPageItems.slice(0, 12);

    // Sidebar popular content has its OWN catalog query, pinned to the
    // browse (POPULAR) flow. It shares the react-query cache entry with the
    // initial popular fetch, so no extra request is made — but its data can
    // never be replaced by search results, which live under different keys.
    const popularCatalogQuery = useComicsCatalog(
        activeSource?.type ?? null,
        1,
        "POPULAR",
        "",
        false,
    );
    const popularItems = popularCatalogQuery.data?.items.slice(0, 12) ?? [];

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
                </div>
            }
            popular={
                <PopularContentList
                    title={`Popular on ${sourceHeading}`}
                    items={popularItems}
                />
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
                    onClearSearch={handleClearSearch}
                    onLoadMore={() => catalogQuery.fetchNextPage()}
                />
            ) : (
                <BrowseSections
                    sourceHeading={sourceHeading}
                    catalogItems={catalogItems}
                    carouselItems={carouselItems}
                    featuredItem={featuredItem}
                    catalogQuery={catalogQuery}
                    onLoadMore={() => catalogQuery.fetchNextPage()}
                />
            )}
        </ExploreLayout>
    );
}

interface CatalogSectionProps {
    sourceHeading: string;
    catalogItems: MediaItem[];
    catalogQuery: ReturnType<typeof useComicsInfiniteCatalog>;
    onLoadMore: () => void;
}

function BrowseSections({
    sourceHeading,
    catalogItems,
    carouselItems,
    featuredItem,
    catalogQuery,
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
                    hasNextPage={catalogQuery.hasNextPage ?? false}
                    isFetchingNextPage={catalogQuery.isFetchingNextPage}
                    onLoadMore={onLoadMore}
                />
            </section>
        </>
    );
}
