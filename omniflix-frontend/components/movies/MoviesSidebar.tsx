"use client";

import { PopularContentList } from "@/components/explore/PopularContentList";
import { SearchBar } from "@/components/explore/SearchBar";
import type { MediaItem } from "@/lib/media";

/** Sidebar content: search bar plus the Popular Movies list. */
export function MoviesSidebar({
    popularMovies,
    error,
}: {
    popularMovies: MediaItem[];
    error?: string;
}) {
    return {
        utilities: <SearchBar id="movies-search" placeholder="Search movies…" />,
        popular: (
            <PopularContentList
                title="Popular Movies"
                items={popularMovies}
                error={error}
            />
        ),
    };
}
