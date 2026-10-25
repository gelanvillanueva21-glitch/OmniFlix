"use client";

import { PopularContentList } from "@/components/explore/PopularContentList";
import { SearchBar } from "@/components/explore/SearchBar";
import type { MediaItem } from "@/lib/media";

/** Sidebar content: search bar plus the two Popular lists. */
export function SeriesSidebar({
    popularSeries,
    popularAnime,
    seriesError,
    animeError,
}: {
    popularSeries: MediaItem[];
    popularAnime: MediaItem[];
    seriesError?: string;
    animeError?: string;
}) {
    return {
        utilities: <SearchBar id="series-search" placeholder="Search series or anime…" />,
        popular: (
            <>
                <PopularContentList title="Popular Series" items={popularSeries} error={seriesError} />
                <PopularContentList title="Popular Anime" items={popularAnime} error={animeError} />
            </>
        ),
    };
}
