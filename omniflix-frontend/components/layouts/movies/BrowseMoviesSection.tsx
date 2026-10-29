"use client";

import { LoadMoreControl } from "@/components/LoadMoreControl";
import { MediaCard } from "@/components/MediaCard";
import { EmptyState, ErrorState, SectionHeader } from "@/components/SectionHeader";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
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
        <section aria-label="Browse movies" className="space-y-4">
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
                    className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
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
            className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
        >
            {Array.from({ length: 10 }, (_, index) => (
                <div key={index} className="space-y-2">
                    <LoadingSkeleton className="aspect-2/3 w-full" />
                    <LoadingSkeleton className="h-3.5 w-3/4" />
                    <LoadingSkeleton className="h-3 w-1/2" />
                </div>
            ))}
        </div>
    );
}
