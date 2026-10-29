"use client";

import { PopularContentList } from "@/components/PopularContentList";
import { SearchBar } from "@/components/SearchBar";
import type { MediaItem } from "@/lib/media";

/** Sidebar content: search bar plus the Popular Novels list. */
export function NovelsSidebar({
    popularNovels,
    error,
    searchQuery,
    onSearchChange,
    onSearchSubmit,
}: {
    popularNovels: MediaItem[];
    error?: string;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    onSearchSubmit?: (query: string) => void;
}) {
    return {
        utilities: (
            <SearchBar
                id="novels-search"
                placeholder="Search novels…"
                value={searchQuery}
                onChange={onSearchChange}
                onSubmit={onSearchSubmit}
            />
        ),
        popular: (
            <PopularContentList
                title="Popular Novels"
                items={popularNovels}
                error={error}
            />
        ),
    };
}
