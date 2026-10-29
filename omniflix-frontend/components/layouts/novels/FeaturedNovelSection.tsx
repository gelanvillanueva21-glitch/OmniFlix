"use client";

import { MediaCard } from "@/components/MediaCard";
import { EmptyState, ErrorState } from "@/components/SectionHeader";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import type { MediaItem } from "@/lib/media";

interface FeaturedNovelSectionProps {
    isPending: boolean;
    isError: boolean;
    errorMessage?: string;
    onRetry: () => void;
    featuredItem?: MediaItem;
}

/** Featured content: same wide-card pattern as the Movies page. */
export function FeaturedNovelSection({
    isPending,
    isError,
    errorMessage,
    onRetry,
    featuredItem,
}: FeaturedNovelSectionProps) {
    return (
        <section aria-label="Featured novel" className="mb-8">
            {isPending ? (
                <LoadingSkeleton className="aspect-12/5 w-full" />
            ) : isError ? (
                <ErrorState
                    message={errorMessage}
                    onRetry={onRetry}
                />
            ) : featuredItem ? (
                <MediaCard media={featuredItem} variant="wide" />
            ) : (
                <EmptyState
                    title="No novels returned"
                    description="The novel library is empty right now. Check back later."
                />
            )}
        </section>
    );
}
