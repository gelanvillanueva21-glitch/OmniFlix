"use client";

import { MediaCarousel } from "@/components/MediaCarousel";
import { SectionHeader } from "@/components/SectionHeader";
import { MediaRowSkeleton } from "@/components/LoadingSkeleton";
import { NOVELS_PAGE_SIZE } from "./novelsQueries";
import type { MediaItem } from "@/lib/media";

interface PopularNovelsCarouselProps {
    items: MediaItem[];
    isPending: boolean;
}

/** Popular novels carousel section. */
export function PopularNovelsCarousel({ items, isPending }: PopularNovelsCarouselProps) {
    return (
        <section aria-label="Popular novels" className="mb-8 space-y-4">
            <SectionHeader title="Popular Novels" />
            {isPending ? (
                <MediaRowSkeleton />
            ) : (
                <MediaCarousel
                    items={items.slice(0, NOVELS_PAGE_SIZE)}
                    label="Popular Novels"
                />
            )}
        </section>
    );
}
