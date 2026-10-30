"use client";

import { LoadMoreControl } from "@/components/LoadMoreControl";
import { MediaCard } from "@/components/MediaCard";
import { EmptyState, ErrorState, SectionHeader } from "@/components/SectionHeader";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import type { MediaItem } from "@/lib/media";

interface BrowseNovelsSectionProps {
    isPending: boolean;
    isError: boolean;
    errorMessage?: string;
    onRetry: () => void;
    novels: MediaItem[];
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    onLoadMore: () => void;
}

/** Single browse grid of novels. */
export function BrowseNovelsSection({
    isPending,
    isError,
    errorMessage,
    onRetry,
    novels,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
}: BrowseNovelsSectionProps) {
    return (
        <section aria-label="Browse novels" className="novels-browse-section">
            <SectionHeader title="Browse Novels" />
            {isPending ? (
                <BrowseGridSkeleton label="Loading novels" />
            ) : isError ? (
                <ErrorState
                    message={errorMessage}
                    onRetry={onRetry}
                />
            ) : novels.length === 0 ? (
                <EmptyState
                    title="Nothing here yet"
                    description="No novels are available yet."
                />
            ) : (
                <ul
                    role="list"
                    className="media-grid"
                >
                    {novels.map((item) => (
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
