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
        <section aria-labelledby="genres-heading" className="genre-chip-section">
            <SectionHeader title="Browse by Genre" />
            {genres.length === 0 ? (
                <EmptyState
                    title="No genres yet"
                    description="Genres will appear here once content data is available."
                />
            ) : (
                <ul role="list" className="genre-chip-list">
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
                                    className={`genre-chip ${isSelected
                                            ? "genre-chip--selected"
                                            : "genre-chip--unselected"
                                        }`}
                                >
                                    {genre.label}
                                    <span className="genre-chip-count">
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
