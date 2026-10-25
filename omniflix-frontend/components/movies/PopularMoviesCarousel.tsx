"use client";

import { MediaCarousel } from "@/components/explore/MediaCarousel";
import { SectionHeader } from "@/components/explore/SectionHeader";
import { MediaRowSkeleton } from "@/components/explore/LoadingSkeleton";
import { POPULAR_MOVIES_LIMIT } from "./moviesQueries";
import type { MediaItem } from "@/lib/media";

interface PopularMoviesCarouselProps {
    items: MediaItem[];
    isPending: boolean;
}

/** Popular movies carousel section. */
export function PopularMoviesCarousel({ items, isPending }: PopularMoviesCarouselProps) {
    return (
        <section aria-label="Popular movies carousel" className="mb-8 space-y-4">
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
