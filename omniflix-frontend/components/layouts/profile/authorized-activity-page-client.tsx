"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    deleteEntertainment,
    getEntertainmentCollection,
} from "@/service/profile.service";
import { fetchEntertainmentMetadata } from "@/service/entertainment-metadata.service";
import type { UserEntertainmentItem } from "@/service/types/profile.payload";
import { MediaCard } from "@/components/MediaCard";
import {
    EmptyState,
    ErrorState,
} from "@/components/SectionHeader";
import { LoadMoreControl } from "@/components/LoadMoreControl";
import { LoadingSkeleton } from "@/components/loading/LoadingSkeleton";
import { ChevronLeftIcon } from "@/components/icons/icons";
import type { MediaItem } from "@/lib/media";
import {
    entertainmentTypeFromMediaType,
    mediaTypeLabel,
    purposeLabel,
    type AuthorizedMediaType,
    type PurposeLabel,
} from "./authorized-activity-types";

/** Number of items revealed per "Load more" step. Matches the guest page. */
const PAGE_SIZE = 20;

/** One resolved card paired with the stored row it came from. */
interface ResolvedEntry {
    readonly media: MediaItem;
    /** Database id of the underlying entertainment row (for DELETE). */
    readonly recordId: number;
}

/**
 * Resolves raw collection records into real provider metadata, dropping
 * entries whose provider fetch fails (same rule as the profile carousels).
 * Each resolved card keeps its stored row id so deletes can target the API.
 */
async function resolveRecordsToEntries(
    records: UserEntertainmentItem[],
): Promise<ResolvedEntry[]> {
    const settled = await Promise.allSettled(
        records.map(async (record) => ({
            media: await fetchEntertainmentMetadata(record),
            recordId: record.id,
        })),
    );

    const resolved: ResolvedEntry[] = [];
    for (const result of settled) {
        if (result.status === "fulfilled") {
            resolved.push(result.value);
        } else {
            console.error("Collection entry could not be loaded", result.reason);
        }
    }
    return resolved;
}

interface AuthorizedActivityPageClientProps {
    /**
     * Optional media-category filter. Undefined (profile/authorize) renders
     * EVERY category stored under the purpose; a concrete type narrows the
     * grid to that category only.
     */
    readonly mediaType?: AuthorizedMediaType;
    /** Collection to read: FAVORITE | WATCHLIST | READLIST | … */
    readonly purposeType: PurposeLabel;
}

/**
 * Authenticated "See all" activity page — the signed-in counterpart of
 * GuestActivityPageClient. Reads the profile's stored collection records for
 * one purpose via the /api/entertainment route, resolves each record into
 * real provider metadata (same fetcher the profile carousels use), then
 * paginates client-side.
 */
export default function AuthorizedActivityPageClient({
    mediaType,
    purposeType,
}: AuthorizedActivityPageClientProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const collectionQuery = useQuery({
        queryKey: ["profile", "collections", "authorized-activity", purposeType],
        queryFn: () => getEntertainmentCollection(purposeType),
        retry: false,
    });

    const records = useMemo(() => {
        const all = collectionQuery.data ?? [];
        if (!mediaType) return all;
        const wanted = entertainmentTypeFromMediaType(mediaType);
        return all.filter((record) => record.entertainmentType === wanted);
    }, [collectionQuery.data, mediaType]);

    const itemsQuery = useQuery({
        queryKey: [
            "profile",
            "collections",
            "authorized-activity-items",
            purposeType,
            mediaType ?? "all",
            records.length,
        ],
        queryFn: () => resolveRecordsToEntries(records),
        enabled: collectionQuery.isSuccess,
        staleTime: 5 * 60 * 1000,
    });

    /** Card id → stored row id, so a delete targets the right API record. */
    const recordIdByMediaId = useMemo(() => {
        const map = new Map<string, number>();
        for (const entry of itemsQuery.data ?? []) {
            map.set(entry.media.id, entry.recordId);
        }
        return map;
    }, [itemsQuery.data]);

    const items = useMemo(
        () => (itemsQuery.data ?? []).map((entry) => entry.media),
        [itemsQuery.data],
    );
    const visibleItems = items.slice(0, visibleCount);
    const hasNextPage = visibleCount < items.length;

    function handleLoadMore() {
        setVisibleCount((current) => Math.min(current + PAGE_SIZE, items.length));
    }

    /**
     * Deletes one collection row through the entertainment API (DELETE with
     * the row id + purpose) and syncs both react-query caches so the grid,
     * the counts and the profile page all reflect the removal immediately.
     */
    async function handleDelete(media: MediaItem) {
        const recordId = recordIdByMediaId.get(media.id);
        if (recordId === undefined) return;
        try {
            await deleteEntertainment({ id: recordId, purpose: purposeType });
        } catch (error) {
            console.error("Collection entry could not be deleted", error);
            return;
        }
        queryClient.setQueryData<ResolvedEntry[]>(
            [
                "profile",
                "collections",
                "authorized-activity-items",
                purposeType,
                mediaType ?? "all",
                recordIdByMediaId.size,
            ],
            (current) =>
                (current ?? []).filter((entry) => entry.media.id !== media.id),
        );
        queryClient.invalidateQueries({
            queryKey: [
                "profile",
                "collections",
                "authorized-activity",
                purposeType,
            ],
        });
    }

    const purpose = purposeLabel(purposeType);
    const pageTitle = mediaType
        ? `${mediaTypeLabel(mediaType)} — ${purpose}`
        : purpose;

    const header = (
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
                <h1 className="guest-activity-title">{pageTitle}</h1>
            </div>
        </header>
    );

    if (collectionQuery.isPending || (collectionQuery.isSuccess && itemsQuery.isPending)) {
        return (
            <div className="guest-activity-page">
                {header}
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

    if (collectionQuery.isError || itemsQuery.isError) {
        const error = collectionQuery.error ?? itemsQuery.error;
        return (
            <div className="guest-activity-page">
                {header}
                <ErrorState
                    message={
                        error instanceof Error ? error.message : undefined
                    }
                    onRetry={() =>
                        void (collectionQuery.isError
                            ? collectionQuery.refetch()
                            : itemsQuery.refetch())
                    }
                />
            </div>
        );
    }

    return (
        <div className="guest-activity-page">
            {header}

            {items.length === 0 ? (
                <div className="guest-activity-empty">
                    <EmptyState
                        title={`Nothing in ${purpose} yet`}
                        description={`Titles you add to ${purpose} will appear here.`}
                    />
                </div>
            ) : (
                <>
                    <ul role="list" className="media-grid">
                        {visibleItems.map((item) => (
                            <li key={item.id}>
                                <MediaCard
                                    media={item}
                                    onDelete={handleDelete}
                                />
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
