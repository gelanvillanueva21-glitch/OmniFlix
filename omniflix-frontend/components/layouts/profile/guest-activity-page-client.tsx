"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    clearActivityGuestData,
    fetchGuestActivityMediaItems,
} from "@/service/guest.service";
import { MediaCard } from "@/components/MediaCard";
import {
    EmptyState,
    ErrorState,
} from "@/components/SectionHeader";
import { LoadMoreControl } from "@/components/LoadMoreControl";
import { LoadingSkeleton } from "@/components/loading/LoadingSkeleton";
import {
    ChevronLeftIcon,
    TrashIcon,
} from "@/components/icons/icons";
import type { MediaItem } from "@/lib/media";

/** Number of items revealed per "Load more" step. Matches the explore grids. */
const GUEST_ACTIVITY_PAGE_SIZE = 20;

const INITIAL_VISIBLE_COUNT = GUEST_ACTIVITY_PAGE_SIZE;

/**
 * Complete guest media activity history. Reads the same
 * ["profile", "guest-activity"] cache entry the profile page uses, then
 * paginates the resolved collection client-side — the localStorage-backed
 * source already returns everything at once, so there is no remote paging.
 */
export default function GuestActivityPageClient() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

    const activityQuery = useQuery({
        queryKey: ["profile", "guest-activity"],
        queryFn: fetchGuestActivityMediaItems,
        retry: false,
    });

    const items = useMemo(() => activityQuery.data ?? [], [activityQuery.data]);
    const visibleItems = items.slice(0, visibleCount);
    const hasNextPage = visibleCount < items.length;

    function handleLoadMore() {
        setVisibleCount((current) =>
            Math.min(current + GUEST_ACTIVITY_PAGE_SIZE, items.length),
        );
    }

    /**
     * Clears every stored guest activity entry and syncs the shared
     * ["profile", "guest-activity"] cache to the empty collection so both
     * this page and the profile page reflect the deletion immediately,
     * without a redundant refetch of metadata that no longer exists.
     */
    function handleClearHistory() {
        clearActivityGuestData();
        queryClient.setQueryData<MediaItem[]>(["profile", "guest-activity"], []);
        setVisibleCount(INITIAL_VISIBLE_COUNT);
    }

    if (activityQuery.isPending) {
        return (
            <div className="guest-activity-page">
                <header className="guest-activity-header">
                    <div className="guest-activity-header-left">
                        <button
                            type="button"
                            aria-label="Back to Profile"
                            onClick={() => router.push("/profile")}
                            className="guest-activity-back"
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        <h1 className="guest-activity-title">Activity History</h1>
                    </div>
                </header>
                <div className="media-grid" role="status">
                    {Array.from({ length: 10 }, (_, index) => (
                        <div key={index} className="media-grid-skeleton-cell">
                            <LoadingSkeleton className="media-grid-skeleton-poster" />
                            <LoadingSkeleton className="media-grid-skeleton-title" />
                            <LoadingSkeleton className="media-grid-skeleton-subtitle" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (activityQuery.isError) {
        return (
            <div className="guest-activity-page">
                <header className="guest-activity-header">
                    <div className="guest-activity-header-left">
                        <button
                            type="button"
                            aria-label="Back to Profile"
                            onClick={() => router.push("/profile")}
                            className="guest-activity-back"
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        <h1 className="guest-activity-title">Activity History</h1>
                    </div>
                </header>
                <ErrorState
                    message={
                        activityQuery.error instanceof Error
                            ? activityQuery.error.message
                            : undefined
                    }
                    onRetry={() => void activityQuery.refetch()}
                />
            </div>
        );
    }

    return (
        <div className="guest-activity-page">
            <header className="guest-activity-header">
                <div className="guest-activity-header-left">
                    <button
                        type="button"
                        aria-label="Back to Profile"
                        onClick={() => router.push("/profile")}
                        className="guest-activity-back"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <h1 className="guest-activity-title">Activity History</h1>
                </div>
                <button
                    type="button"
                    aria-label="Clear activity history"
                    onClick={handleClearHistory}
                    disabled={items.length === 0}
                    className="guest-activity-clear"
                >
                    <TrashIcon className="h-5 w-5" />
                </button>
            </header>

            {items.length === 0 ? (
                <div className="guest-activity-empty">
                    <EmptyState
                        title="No activity yet"
                        description="Titles you browse will appear here. Sign in to keep your history across devices."
                    />
                </div>
            ) : (
                <>
                    <ul role="list" className="media-grid">
                        {visibleItems.map((item) => (
                            <li key={item.id}>
                                <MediaCard media={item} />
                            </li>
                        ))}
                    </ul>
                    <LoadMoreControl
                        hasNextPage={hasNextPage}
                        isFetchingNextPage={false}
                        onLoadMore={handleLoadMore}
                    />
                </>
            )}
        </div>
    );
}
