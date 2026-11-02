"use client";

import { LoadMoreControl } from "@/components/LoadMoreControl";
import { MediaCard } from "@/components/MediaCard";
import { EmptyState, ErrorState, SectionHeader } from "@/components/SectionHeader";
import { LoadingSkeleton } from "@/components/loading/LoadingSkeleton";
import type { MediaItem } from "@/lib/media";

interface BrowseMoviesSectionProps {
    isPending: boolean;
    isError: boolean;
    errorMessage?: string;
    onRetry: () => void;
    browseMovies: MediaItem[];
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    onLoadMore: () => void;
}

/** Single browse grid of popular TMDB movies. */
export function BrowseMoviesSection({
    isPending,
    isError,
    errorMessage,
    onRetry,
    browseMovies,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
}: BrowseMoviesSectionProps) {
    return (
        <section aria-label="Browse movies" className="movies-browse-section">
            <SectionHeader title="Browse Movies" />
            {isPending ? (
                <BrowseGridSkeleton label="Loading movies" />
            ) : isError ? (
                <ErrorState
                    message={errorMessage}
                    onRetry={onRetry}
                />
            ) : browseMovies.length === 0 ? (
                <EmptyState
                    title="Nothing here yet"
                    description="No popular movies are available right now."
                />
            ) : (
                <ul
                    role="list"
                    className="media-grid"
                >
                    {browseMovies.map((item) => (
                        <li key={item.id}>
                            <MediaCard media={item} />
                        </li>
                    ))}
                </ul>
            )}
            <LoadMoreControl
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onLoadMore={onLoadMore}
            />
        </section>
    );
}

function BrowseGridSkeleton({ label }: { label: string }) {
    return (
        <div
            role="status"
            aria-label={label}
            className="media-grid"
        >
            {Array.from({ length: 10 }, (_, index) => (
                <div key={index} className="media-grid-skeleton-cell">
                    <LoadingSkeleton className="media-grid-skeleton-poster" />
                    <LoadingSkeleton className="media-grid-skeleton-title" />
                    <LoadingSkeleton className="media-grid-skeleton-subtitle" />
                </div>
            ))}
        </div>
    );
}
