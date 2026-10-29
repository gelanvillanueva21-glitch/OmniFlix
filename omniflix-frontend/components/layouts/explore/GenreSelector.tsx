"use client";

import { useState } from "react";
import { EmptyState, SectionHeader } from "@/components/SectionHeader";
import type { Genre, MediaItem } from "@/lib/media";

interface GenreSelectorProps {
    readonly genres: Genre[];
    /** Items used to show a small count badge per genre. */
    readonly items: MediaItem[];
}

/**
 * Controlled chip row. Selection state lives here for now; when genre
 * filtering moves to a real catalog route, this becomes a link-based
 * component and the state moves to the URL.
 */
export function GenreSelector({ genres, items }: GenreSelectorProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    function countFor(genreId: string): number {
        const label = genres.find((g) => g.id === genreId)?.label;
        if (label === undefined) return 0;
        return items.filter((item) => item.genres?.includes(label)).length;
    }

    return (
        <section aria-labelledby="genres-heading" className="space-y-4">
            <SectionHeader title="Browse by Genre" />
            {genres.length === 0 ? (
                <EmptyState
                    title="No genres yet"
                    description="Genres will appear here once content data is available."
                />
            ) : (
                <ul role="list" className="flex flex-wrap gap-2">
                    {genres.map((genre) => {
                        const isSelected = selectedId === genre.id;
                        const count = countFor(genre.id);

                        return (
                            <li key={genre.id}>
                                <button
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() =>
                                        setSelectedId(isSelected ? null : genre.id)
                                    }
                                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${isSelected
                                            ? "border-[#8B5CF6] bg-[#8B5CF6] text-white"
                                            : "border-[#29292E] bg-transparent text-[#A1A1AA] hover:border-[#8B5CF6]/50 hover:text-[#F5F5F5]"
                                        }`}
                                >
                                    {genre.label}
                                    <span className="ml-1.5 text-xs opacity-70">
                                        {count}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
