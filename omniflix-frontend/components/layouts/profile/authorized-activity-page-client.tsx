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

interface ResolvedEntries {
    readonly entries: ResolvedEntry[];
    readonly failedCount: number;
}

/**
 * Resolves raw collection records into real provider metadata. Each resolved
 * card keeps its stored row id so deletes can target the correct API record.
 */
async function resolveRecordsToEntries(
    records: UserEntertainmentItem[],
): Promise<ResolvedEntries> {
    const entries: ResolvedEntry[] = [];
    let failedCount = 0;

    for (let offset = 0; offset < records.length; offset += 4) {
        const batch = records.slice(offset, offset + 4);
        const settled = await Promise.allSettled(
            batch.map(async (record) => ({
                media: await fetchEntertainmentMetadata(record),
                recordId: record.id,
            })),
        );

        for (const result of settled) {
            if (result.status === "fulfilled") {
                entries.push(result.value);
            } else {
                failedCount += 1;
                console.error("Collection entry could not be loaded", result.reason);
            }
        }
    }

    return { entries, failedCount };
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

    const recordSetKey = JSON.stringify(
        records.map((record) => [
            record.id,
            record.externalId,
            record.apiSource,
            record.entertainmentType,
        ]),
    );
    const itemsQueryKey = [
        "profile",
        "collections",
        "authorized-activity-items",
        purposeType,
        mediaType ?? "all",
        recordSetKey,
    ] as const;

    const itemsQuery = useQuery({
        queryKey: itemsQueryKey,
        queryFn: () => resolveRecordsToEntries(records),
        enabled: collectionQuery.isSuccess,
        staleTime: 5 * 60 * 1000,
    });

    const entries = itemsQuery.data?.entries ?? [];
    const items = entries.map((entry) => entry.media);
    const visibleEntries = entries.slice(0, visibleCount);
    const hasNextPage = visibleCount < items.length;

    function handleLoadMore() {
        setVisibleCount((current) => Math.min(current + PAGE_SIZE, items.length));
    }

    /**
     * Deletes one collection row through the entertainment API (DELETE with
     * the row id + purpose), then invalidates both collection queries so the
     * See All page and Profile page reload the authoritative records.
     */
    async function handleDelete(entry: ResolvedEntry) {
        try {
            await deleteEntertainment({
                id: entry.recordId,
                purpose: purposeType,
            });
        } catch (error) {
            console.error("Collection entry could not be deleted", error);
            return;
        }
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: [
                    "profile",
                    "collections",
                    "authorized-activity",
                    purposeType,
                ],
                exact: true,
            }),
            queryClient.invalidateQueries({
                queryKey: ["profile", "collections", purposeType],
                exact: true,
            }),
        ]);
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

            {items.length === 0 && itemsQuery.data?.failedCount === 0 ? (
                <div className="guest-activity-empty">
                    <EmptyState
                        title={`Nothing in ${purpose} yet`}
                        description={`Titles you add to ${purpose} will appear here.`}
                    />
                </div>
            ) : items.length === 0 ? (
                <ErrorState
                    message={`${itemsQuery.data?.failedCount ?? 0} collection item${
                        itemsQuery.data?.failedCount === 1 ? "" : "s"
                    } could not be loaded.`}
                    onRetry={() => void itemsQuery.refetch()}
                />
            ) : (
                <>
                    {(itemsQuery.data?.failedCount ?? 0) > 0 && (
                        <p
                            className="profile-collections-status"
                            role="status"
                        >
                            {itemsQuery.data?.failedCount} item
                            {itemsQuery.data?.failedCount === 1 ? "" : "s"} could
                            not be loaded.
                        </p>
                    )}
                    <ul role="list" className="media-grid">
                        {visibleEntries.map((entry) => (
                            <li key={entry.recordId}>
                                <MediaCard
                                    media={entry.media}
                                    onDelete={() => handleDelete(entry)}
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
