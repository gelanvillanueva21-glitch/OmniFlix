"use client";

import { useEffect, useState } from "react";
import { ExploreLayout } from "@/components/explore/ExploreLayout";
import { MediaCard } from "@/components/explore/MediaCard";
import { MediaCarousel } from "@/components/explore/MediaCarousel";
import { GenreSelector } from "@/components/explore/GenreSelector";
import { PopularContentList } from "@/components/explore/PopularContentList";
import { SearchBar } from "@/components/explore/SearchBar";
import { SectionHeader, EmptyState, ErrorState } from "@/components/explore/SectionHeader";
import { ExploreContentSkeleton } from "@/components/explore/ExploreLoadingSkeleton";
import type { ExploreData } from "@/lib/explore";

const DISCOVER_PAGE_SIZE = 8;

const POPULAR_SECTIONS = [
    { key: "comics", title: "Popular Comics" },
    { key: "novels", title: "Popular Novels" },
    { key: "movies", title: "Popular Movies" },
    { key: "series", title: "Popular Series" },
] as const;

export default function ExplorePage() {
    const [visibleDiscoverCount, setVisibleDiscoverCount] =
        useState(DISCOVER_PAGE_SIZE);
    const [exploreData, setExploreData] = useState<ExploreData | null>(null);
    const [requestError, setRequestError] = useState<string | null>(null);
    useEffect(() => {
        fetchExploreData()
            .then(setExploreData)
            .catch((error: unknown) => {
                setRequestError(
                    error instanceof Error
                        ? error.message
                        : "Explore providers could not be loaded.",
                );
            });
    }, []);
    if (requestError) {
        return (
            <ExploreLayout>
                <ErrorState message={requestError} />
            </ExploreLayout>
        );
    }

    if (!exploreData) {
        return (
            <ExploreLayout>
                <ExploreContentSkeleton />
            </ExploreLayout>
        );
    }
    const discoverItems = exploreData.discover.slice(
        0,
        visibleDiscoverCount,
    );
    const hasMoreDiscover =
        visibleDiscoverCount < exploreData.discover.length;

    return (
        <ExploreLayout
            utilities={
                <div className="space-y-4">
                    <SearchBar />
                    <p className="text-xs text-[#A1A1AA]">
                        Search results arrive with the catalog API.
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
            {/* 1. Page heading */}
            <header className="mb-6">
                <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[#F5F5F5] sm:text-3xl">
                    Explore
                </h1>
                <p className="mt-1 text-sm text-[#A1A1AA] sm:text-base">
                    Discover comics, novels, movies, and series — all in one place.
                </p>
            </header>

            {/* 2. Featured */}
            <section aria-labelledby="featured-heading" className="mb-8">
                <h2 id="featured-heading" className="sr-only">
                    Featured content
                </h2>
                {exploreData.featured ? (
                    <MediaCard
                        media={exploreData.featured}
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
            <section aria-labelledby="trending-heading" className="mb-8 space-y-4">
                <SectionHeader title="Trending Now" />
                <MediaCarousel
                    items={exploreData.trending}
                    label="Trending Now"
                />
            </section>

            {/* 4. Recommended (general selection — not personalized yet) */}
            <section aria-labelledby="recommended-heading" className="mb-8 space-y-4">
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
            <section className="mb-8">
                <GenreSelector
                    genres={exploreData.genres}
                    items={exploreData.discover}
                />
            </section>

            {/* 6. Discover More (incrementally loaded grid) */}
            <section aria-labelledby="discover-heading" className="space-y-4">
                <SectionHeader title="Discover More" />
                {discoverItems.length === 0 ? (
                    <EmptyState
                        title="Nothing to discover yet"
                        description="Content will appear here once the catalog is connected."
                    />
                ) : (
                    <>
                        <ul
                            role="list"
                            className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
                        >
                            {discoverItems.map((item) => (
                                <li key={item.id}>
                                    <MediaCard
                                        media={item}
                                    />
                                </li>
                            ))}
                        </ul>
                        {hasMoreDiscover && (
                            <div className="flex justify-center pt-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setVisibleDiscoverCount(
                                            (count) => count + DISCOVER_PAGE_SIZE,
                                        )
                                    }
                                    className="rounded-full border border-[#29292E] px-5 py-2 text-sm font-medium text-[#F5F5F5] transition-colors hover:border-[#8B5CF6]/60 hover:bg-[#8B5CF6]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                                >
                                    Load more
                                </button>
                            </div>
                        )}
                    </>
                )}
            </section>
        </ExploreLayout>
    );
}

async function fetchExploreData(): Promise<ExploreData> {
    const response = await fetch("/api/explore");

    if (!response.ok) {
        throw new Error("Explore providers could not be loaded.");
    }

    return response.json() as Promise<ExploreData>;
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

