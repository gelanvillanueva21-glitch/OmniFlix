"use client";

import { PopularContentList } from "@/components/PopularContentList";
import { SearchBar } from "@/components/SearchBar";
import type { MediaItem } from "@/lib/media";

/** Sidebar content: search bar plus the Popular Movies list. */
export function MoviesSidebar({
    popularMovies,
    error,
    searchQuery,
    onSearchChange,
    onSearchSubmit,
}: {
    popularMovies: MediaItem[];
    error?: string;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    onSearchSubmit?: (query: string) => void;
}) {
    return {
        utilities: (
            <SearchBar
                id="movies-search"
                placeholder="Search movies…"
                value={searchQuery}
                onChange={onSearchChange}
                onSubmit={onSearchSubmit}
            />
        ),
        popular: (
            <PopularContentList
                title="Popular Movies"
                items={popularMovies}
                error={error}
            />
        ),
    };
}
