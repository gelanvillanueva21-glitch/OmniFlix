"use client";

import { useMemo, useState } from "react";
import { ExploreLayout } from "@/components/explore/ExploreLayout";
import { MediaCard } from "@/components/explore/MediaCard";
import { MediaCarousel } from "@/components/explore/MediaCarousel";
import { GenreSelector } from "@/components/explore/GenreSelector";
import { PopularContentList } from "@/components/explore/PopularContentList";
import { SearchBar } from "@/components/explore/SearchBar";
import { SectionHeader, EmptyState } from "@/components/explore/SectionHeader";
import {
    MOCK_FEATURED,
    MOCK_TRENDING,
    MOCK_RECOMMENDED,
    MOCK_GENRES,
    MOCK_POPULAR,
    MOCK_DISCOVER,
} from "@/lib/mock-media";

const DISCOVER_PAGE_SIZE = 8;

const POPULAR_SECTIONS = [
    { key: "comics", title: "Popular Comics" },
    { key: "novels", title: "Popular Novels" },
    { key: "movies", title: "Popular Movies" },
    { key: "series", title: "Popular Series" },
] as const;

/**
 * Explore page — currently fed by mock data. To move to a real API, replace
 * the MOCK_* imports with React Query hooks that call service functions which
 * map provider responses into MediaItem (see lib/media.ts). No UI change
 * should be required.
 */
export default function ExplorePage() {
    const [visibleDiscoverCount, setVisibleDiscoverCount] =
        useState(DISCOVER_PAGE_SIZE);

    const discoverItems = MOCK_DISCOVER.slice(0, visibleDiscoverCount);
    const hasMoreDiscover = visibleDiscoverCount < MOCK_DISCOVER.length;

    /**
     * Genre personalization isn't implemented yet, so this is a deterministic
     * general selection rather than a personalized one (no fabricated claims).
     * When user genre preferences exist, replace with a real recommendation
     * query filtered by the user's saved genres.
     */
    const recommendedItems = useMemo(() => MOCK_RECOMMENDED, []);

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
                    items={MOCK_POPULAR[section.key]}
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
                <MediaCard media={MOCK_FEATURED} variant="wide" />
            </section>

            {/* 3. Trending Now */}
            <section aria-labelledby="trending-heading" className="mb-8 space-y-4">
                <SectionHeader title="Trending Now" />
                <MediaCarousel items={MOCK_TRENDING} label="Trending Now" />
            </section>

            {/* 4. Recommended (general selection — not personalized yet) */}
            <section aria-labelledby="recommended-heading" className="mb-8 space-y-4">
                <SectionHeader title="Recommended for You" />
                {recommendedItems.length === 0 ? (
                    <EmptyState
                        title="No recommendations yet"
                        description="Pick a few genres to get recommendations tailored to you."
                    />
                ) : (
                    <MediaCarousel
                        items={recommendedItems}
                        label="Recommended for You"
                    />
                )}
            </section>

            {/* 5. Browse by Genre */}
            <section className="mb-8">
                <GenreSelector genres={MOCK_GENRES} items={MOCK_DISCOVER} />
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
                                    <MediaCard media={item} />
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

