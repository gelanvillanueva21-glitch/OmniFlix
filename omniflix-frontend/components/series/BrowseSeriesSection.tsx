"use client";

import { LoadMoreControl } from "@/components/comics/LoadMoreControl";
import { MediaCard } from "@/components/explore/MediaCard";
import { EmptyState, ErrorState, SectionHeader } from "@/components/explore/SectionHeader";
import { LoadingSkeleton } from "@/components/explore/LoadingSkeleton";
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
        <section aria-label="Browse series" className="space-y-4">
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
                        className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
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
