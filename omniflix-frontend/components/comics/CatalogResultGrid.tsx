"use client";

import { MediaCard } from "@/components/explore/MediaCard";
import {
    EmptyState,
    ErrorState,
} from "@/components/explore/SectionHeader";
import { LoadingSkeleton } from "@/components/explore/LoadingSkeleton";
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
                className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
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
                <p role="status" className="mt-4 text-sm text-[#A1A1AA]">
                    Loading more…
                </p>
            )}
        </div>
    );
}
