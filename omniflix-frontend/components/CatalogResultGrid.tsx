"use client";

import { MediaCard } from "@/components/MediaCard";
import {
    EmptyState,
    ErrorState,
} from "@/components/SectionHeader";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import type { MediaItem } from "@/lib/media";

interface CatalogResultGridProps {
    items: MediaItem[];
    isPending: boolean;
    isFetching: boolean;
    error?: string;
    onRetry: () => void;
    emptyDescription: string;
}

export function CatalogResultGrid({
    items,
    isPending,
    isFetching,
    error,
    onRetry,
    emptyDescription,
}: CatalogResultGridProps) {
    if (isPending) {
        return (
            <div
                role="status"
                aria-label="Loading comics"
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

    if (error !== undefined) {
        return <ErrorState message={error} onRetry={onRetry} />;
    }

    if (items.length === 0) {
        return (
            <EmptyState
                title="Nothing here yet"
                description={emptyDescription}
            />
        );
    }

    return (
        <div aria-busy={isFetching}>
            <ul
                role="list"
                className="media-grid"
            >
                {items.map((item) => (
                    <li key={item.id}>
                        <MediaCard
                            media={item}
                        />
                    </li>
                ))}
            </ul>
            {isFetching && (
                <p role="status" className="media-grid-more-status">
                    Loading more…
                </p>
            )}
        </div>
    );
}
