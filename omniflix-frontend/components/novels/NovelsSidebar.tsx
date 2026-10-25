"use client";

import { PopularContentList } from "@/components/explore/PopularContentList";
import { SearchBar } from "@/components/explore/SearchBar";
import type { MediaItem } from "@/lib/media";

/** Sidebar content: search bar plus the Popular Novels list. */
export function NovelsSidebar({
    popularNovels,
    error,
}: {
    popularNovels: MediaItem[];
    error?: string;
}) {
    return {
        utilities: <SearchBar id="novels-search" placeholder="Search novels…" />,
        popular: (
            <PopularContentList
                title="Popular Novels"
                items={popularNovels}
                error={error}
            />
        ),
    };
}
