"use client";

import { LoadMoreControl } from "@/components/LoadMoreControl";
import { MediaCard } from "@/components/MediaCard";
import { EmptyState, ErrorState, SectionHeader } from "@/components/SectionHeader";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import type { MediaItem } from "@/lib/media";

interface BrowseSeriesSectionProps {
    isPending: boolean;
    isError: boolean;
    errorMessage?: string;
    onRetry: () => void;
    browseItems: MediaItem[];
    hasProviderError: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    onLoadMore: () => void;
}

/** Single combined browse grid: TMDB series + Jikan anime mixed. */
export function BrowseSeriesSection({
    isPending,
    isError,
    errorMessage,
    onRetry,
    browseItems,
    hasProviderError,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
}: BrowseSeriesSectionProps) {
    return (
        <section aria-label="Browse series" className="series-browse-section">
            <SectionHeader title="Browse Series" />
            {isPending ? (
                <BrowseGridSkeleton label="Loading series" />
            ) : isError ? (
                <ErrorState
                    message={errorMessage}
                    onRetry={onRetry}
                />
            ) : browseItems.length === 0 ? (
                <EmptyState
                    title="Nothing here yet"
                    description="No popular series or anime are available right now."
                />
            ) : (
                <>
                    {hasProviderError && (
                        <ErrorState message="A provider failed on the last load; showing results from the other." />
                    )}
                    <ul
                        role="list"
                        className="media-grid"
                    >
                        {browseItems.map((item) => (
                            <li key={item.id}>
                                <MediaCard media={item} />
                            </li>
                        ))}
                    </ul>
                </>
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
