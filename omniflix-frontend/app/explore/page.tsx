"use client";

import { useState } from "react";
import { ExploreLayout } from "@/components/layouts/explore/ExploreLayout";
import { MediaCard } from "@/components/MediaCard";
import { MediaCarousel } from "@/components/MediaCarousel";
import { GenreSelector } from "@/components/layouts/explore/GenreSelector";
import { PopularContentList } from "@/components/PopularContentList";
import { SearchBar } from "@/components/SearchBar";
import { LoadMoreControl } from "@/components/LoadMoreControl";
import { SectionHeader, EmptyState, ErrorState } from "@/components/SectionHeader";
import { LoadingSkeleton } from "@/components/loading/LoadingSkeleton";
import { ExploreContentSkeleton } from "@/components/loading/ExploreContentSkeleton";
import { dedupeById, useDiscoverBrowse, useExploreOverview } from "@/components/layouts/explore/discoverQueries";
import { SearchResultsSection } from "@/components/SearchResultsSection";
import { useGlobalSearch } from "@/components/layouts/explore/useGlobalSearch";
import useDebounce from "@/lib/debounce";
import type { ExploreData } from "@/lib/explore";
import { selectRandomFeaturedMedia } from "@/lib/selectRandomFeaturedMedia";


const POPULAR_SECTIONS = [
    { key: "comics", title: "Popular Comics" },
    { key: "novels", title: "Popular Novels" },
    { key: "movies", title: "Popular Movies" },
    { key: "series", title: "Popular Series" },
] as const;

export default function ExplorePage() {
    // Live global search state: the input value updates instantly, the
    // debounced value drives fetching, and results show once two characters
    // are typed.
    const [searchQuery, setSearchQuery] = useState("");
    const trimmedQuery = searchQuery.trim();
    const debouncedQuery = useDebounce(trimmedQuery, 400);
    const isSearchMode = trimmedQuery.length >= 2;
    const search = useGlobalSearch(debouncedQuery, trimmedQuery, isSearchMode);

    // Page-1 overview feeds the featured card, trending/recommended carousels,
    // and the genre chips; untouched by discover pagination.
    const overviewQuery = useExploreOverview();

    // Discover More pagination: appends merged provider pages on demand.
    const discoverQuery = useDiscoverBrowse();
    const discoverItems = dedupeById(
        discoverQuery.data?.pages.flatMap((page) => page.items) ?? [],
    );

    if (overviewQuery.isPending) {
        return (
            <ExploreLayout>
                <ExploreContentSkeleton />
            </ExploreLayout>
        );
    }

    if (overviewQuery.isError) {
        return (
            <ExploreLayout>
                <ErrorState
                    message={
                        overviewQuery.error instanceof Error
                            ? overviewQuery.error.message
                            : "Explore providers could not be loaded."
                    }
                    onRetry={() => overviewQuery.refetch()}
                />
            </ExploreLayout>
        );
    }

    const exploreData = overviewQuery.data;

    if (!exploreData) {
        return (
            <ExploreLayout>
                <ExploreContentSkeleton />
            </ExploreLayout>
        );
    }

    const wideCard = selectRandomFeaturedMedia(exploreData.popular);

    return (
        <ExploreLayout
            utilities={
                <div className="explore-overview-utilities">
                    <SearchBar
                        id="explore-search"
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onSubmit={setSearchQuery}
                    />
                    <p className="explore-overview-utilities-note">
                        Search anime, series, movies, comics, and novels as you type.
                    </p>
                </div>
            }
            popular={POPULAR_SECTIONS.map((section) => (
                <PopularContentList
                    key={section.key}
                    title={section.title}
                    items={exploreData.popular[section.key]}
                    error={getSectionError(exploreData, section.key)}
                />
            ))}
        >
            {/* Search mode replaces the browse sections but keeps the sidebar's popular lists untouched. */}
            {isSearchMode ? (
                <SearchResultsSection
                    submittedQuery={trimmedQuery}
                    sourceHeading="all categories"
                    catalogItems={search.items}
                    catalogQuery={search.catalogQuery}
                    onClearSearch={() => setSearchQuery("")}
                />
            ) : (
            <>
            {/* 1. Page heading */}
            <header className="explore-page-heading">
                <h1 className="explore-page-title">
                    Explore
                </h1>
                <p className="explore-page-subtitle">
                    Discover comics, novels, movies, and series — all in one place.
                </p>
            </header>

            {/* 2. Featured */}
            <section aria-labelledby="featured-heading" className="explore-featured-section">
                <h2 id="featured-heading" className="sr-only">
                    Featured content
                </h2>
                {wideCard ? (
                    <MediaCard
                        media={wideCard}
                        variant="wide"
                    />
                ) : (
                    <EmptyState
                        title="No featured content"
                        description="Configured providers returned no content."
                    />
                )}
            </section>

            {/* 3. Trending Now */}
            <section aria-labelledby="trending-heading" className="explore-carousel-section">
                <SectionHeader title="Trending Now" />
                <MediaCarousel
                    items={exploreData.trending}
                    label="Trending Now"
                />
            </section>

            {/* 4. Recommended (general selection — not personalized yet) */}
            <section aria-labelledby="recommended-heading" className="explore-carousel-section">
                <SectionHeader title="Recommended for You" />
                {exploreData.recommended.length === 0 ? (
                    <EmptyState
                        title="No recommendations yet"
                        description="Pick a few genres to get recommendations tailored to you."
                    />
                ) : (
                    <MediaCarousel
                        items={exploreData.recommended}
                        label="Recommended for You"
                    />
                )}
            </section>

            {/* 5. Browse by Genre */}
            <section className="explore-genre-section">
                <GenreSelector
                    genres={exploreData.genres}
                    items={exploreData.discover}
                />
            </section>

            {/* 6. Discover More (server-paginated grid) */}
            <section aria-labelledby="discover-heading" className="explore-discover-section">
                <SectionHeader title="Discover More" />
                {discoverQuery.isPending ? (
                    <div
                        role="status"
                        aria-label="Loading discover content"
                        className="media-grid"
                    >
                        {Array.from({ length: 10 }, (_, index) => (
                            <div key={index} className="media-grid-skeleton-cell">
                                <LoadingSkeleton className="media-grid-skeleton-poster" />
                                <LoadingSkeleton className="media-grid-skeleton-title" />
                                <LoadingSkeleton className="media-grid-skeleton-subtitle" />
                            </div>
                        ))}
                    </div>
                ) : discoverQuery.isError ? (
                    <ErrorState
                        message={
                            discoverQuery.error instanceof Error
                                ? discoverQuery.error.message
                                : "Discover content could not be loaded."
                        }
                        onRetry={() => discoverQuery.refetch()}
                    />
                ) : discoverItems.length === 0 ? (
                    <EmptyState
                        title="Nothing to discover yet"
                        description="Content will appear here once the catalog is connected."
                    />
                ) : (
                    <>
                        <ul
                            role="list"
                            className="media-grid"
                        >
                            {discoverItems.map((item) => (
                                <li key={item.id}>
                                    <MediaCard
                                        media={item}
                                    />
                                </li>
                            ))}
                        </ul>
                        <LoadMoreControl
                            hasNextPage={
                                discoverQuery.data
                                    ? discoverQuery.hasNextPage
                                    : false
                            }
                            isFetchingNextPage={discoverQuery.isFetchingNextPage}
                            onLoadMore={() => discoverQuery.fetchNextPage()}
                        />
                    </>
                )}
            </section>
            </>
            )}
        </ExploreLayout>
    );
}

function getSectionError(
    exploreData: ExploreData,
    sectionKey: keyof ExploreData["popular"],
): string | undefined {
    if (exploreData.popular[sectionKey].length > 0) {
        return undefined;
    }

    if (sectionKey === "comics") {
        return exploreData.errors.comics;
    }

    if (sectionKey === "novels") {
        // Novels are served exclusively by LNcrawl now.
        return exploreData.errors.lncrawl;
    }

    if (sectionKey === "movies") {
        return exploreData.errors.tmdb;
    }

    return exploreData.errors.jikan ?? exploreData.errors.tmdb;
}
