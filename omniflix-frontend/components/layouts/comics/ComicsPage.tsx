"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ExploreLayout } from "@/components/layouts/explore/ExploreLayout";
import { MediaCard } from "@/components/MediaCard";
import { MediaCarousel } from "@/components/MediaCarousel";
import { PopularContentList } from "@/components/PopularContentList";
import { SearchBar } from "@/components/SearchBar";
import {
    EmptyState,
    ErrorState,
    SectionHeader,
} from "@/components/SectionHeader";
import { ExploreContentSkeleton } from "@/components/loading/ExploreContentSkeleton";
import {
    LoadingSkeleton,
    MediaRowSkeleton,
} from "@/components/loading/LoadingSkeleton";
import { CatalogResultGrid } from "@/components/CatalogResultGrid";
import { LoadMoreControl } from "@/components/LoadMoreControl";
import { SearchResultsSection } from "@/components/SearchResultsSection";
import { SourceSelector } from "@/components/layouts/comics/SourceSelector";
import {
    dedupeById,
    useComicsCatalog,
    useComicsInfiniteCatalog,
    useComicsSources,
} from "@/components/layouts/comics/useComicsCatalog";
import type { MediaItem } from "@/lib/media";
import { COMICK_SOURCE_TYPE } from "@/service/suwayomi/suwayomi.service";
import useDebounce from '@/lib/debounce';
import { selectRandomMediaFeatured } from "@/lib/selectRandomFeaturedMedia";

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

    // Search state mirrors the series page: live input value, debounced for
    // fetching, so results update as the user types.
    const [searchQuery, setSearchQuery] = useState("");
    const trimmedQuery = searchQuery.trim();
    const debouncedQuery = useDebounce(trimmedQuery, 400);

    const isSearchMode = trimmedQuery.length > 0;

    const handleSearch = (query: string) => {
        setSearchQuery(query.trim());
    };

    const handleClearSearch = () => {
        setSearchQuery("");
    };

    const activeSource = visibleSources.find(
        (source) => source.type === sourceType || source.id === sourceType,
    );
    const catalogQuery = useComicsInfiniteCatalog(
        activeSource?.type ?? null,
        isSearchMode ? "SEARCH" : "POPULAR",
        debouncedQuery,
        isSearchMode && debouncedQuery.length > 0,
    );

    const catalogItems = dedupeById(
        catalogQuery.data?.pages.flatMap((page) => page.items) ?? [],
    );
    const firstPageItems = catalogQuery.data?.pages[0]?.items ?? [];
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
    const featuredItem = selectRandomMediaFeatured({ items: popularItems }) ?? firstPageItems[0];

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

    // While the debounce is still catching up, hide stale results and show a
    // loading state — same as the series page.
    const isSearchLoading =
        isSearchMode &&
        (debouncedQuery !== trimmedQuery ||
            catalogQuery.isFetching ||
            catalogQuery.isPending);
    const displayedSearchItems =
        debouncedQuery === trimmedQuery ? catalogItems : [];

    return (
        <ExploreLayout
            utilities={
                <div className="comics-utilities">
                    <SearchBar
                        id="comics-search"
                        placeholder={`Search ${sourceHeading}…`}
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onSubmit={handleSearch}
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
            <header className="comics-page-heading">
                <h1 className="comics-page-title">
                    Comics
                </h1>
                <p className="comics-page-subtitle">
                    Browse manga from your installed Suwayomi sources.
                </p>
            </header>

            {isSearchMode ? (
                <SearchResultsSection
                    submittedQuery={trimmedQuery}
                    sourceHeading={sourceHeading}
                    catalogItems={displayedSearchItems}
                    catalogQuery={{
                        ...catalogQuery,
                        isPending: isSearchLoading,
                        isFetching: isSearchLoading,
                    }}
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
            <section aria-label="Featured comic" className="comics-featured-section">
                {catalogQuery.isPending ? (
                    <LoadingSkeleton className="media-card-wide-frame" />
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

            <section aria-label="Popular comics" className="comics-carousel-section">
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

            <section aria-label="Browse comics" className="comics-browse-section">
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
