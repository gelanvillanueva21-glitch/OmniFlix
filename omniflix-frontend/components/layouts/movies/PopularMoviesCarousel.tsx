"use client";

import { MediaCarousel } from "@/components/MediaCarousel";
import { SectionHeader } from "@/components/SectionHeader";
import { MediaRowSkeleton } from "@/components/LoadingSkeleton";
import { POPULAR_MOVIES_LIMIT } from "./moviesQueries";
import type { MediaItem } from "@/lib/media";

interface PopularMoviesCarouselProps {
    items: MediaItem[];
    isPending: boolean;
}

/** Popular movies carousel section. */
export function PopularMoviesCarousel({ items, isPending }: PopularMoviesCarouselProps) {
    return (
        <section aria-label="Popular movies carousel" className="movies-carousel-section">
            <SectionHeader title="Popular Movies" />
            {isPending ? (
                <MediaRowSkeleton />
            ) : (
                <MediaCarousel
                    items={items.slice(0, POPULAR_MOVIES_LIMIT)}
                    label="Popular Movies"
                />
            )}
        </section>
    );
}
