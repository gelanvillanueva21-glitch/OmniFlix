"use client";

import { MediaCard } from "@/components/MediaCard";
import { EmptyState, ErrorState } from "@/components/SectionHeader";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import type { MediaItem } from "@/lib/media";

interface FeaturedMovieSectionProps {
    isPending: boolean;
    isError: boolean;
    errorMessage?: string;
    onRetry: () => void;
    featuredMovie?: MediaItem;
}

/** Featured content: same wide-card pattern as the Series page. */
export function FeaturedMovieSection({
    isPending,
    isError,
    errorMessage,
    onRetry,
    featuredMovie,
}: FeaturedMovieSectionProps) {
    return (
        <section aria-label="Featured movie" className="mb-8">
            {isPending ? (
                <LoadingSkeleton className="aspect-12/5 w-full" />
            ) : isError ? (
                <ErrorState
                    message={errorMessage}
                    onRetry={onRetry}
                />
            ) : featuredMovie ? (
                <MediaCard media={featuredMovie} variant="wide" />
            ) : (
                <EmptyState
                    title="No movies returned"
                    description="TMDB returned no popular movies right now."
                />
            )}
        </section>
    );
}
