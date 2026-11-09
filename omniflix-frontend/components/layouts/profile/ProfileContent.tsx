"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MediaCarousel } from "@/components/MediaCarousel";
import {
    SectionHeader,
    EmptyState,
    ErrorState,
} from "@/components/SectionHeader";
import type { MediaItem } from "@/lib/media";
import {
    entertainmentIdentityKey,
    fetchEntertainmentMetadata,
} from "@/service/entertainment-metadata.service";
import type {
    EntertainmentListType,
    UserEntertainmentItem,
} from "@/service/types/profile.payload";

/** The seven collections, matching EntertainmentListType in the Prisma schema. */
const COLLECTIONS: readonly { key: EntertainmentListType; label: string }[] = [
    { key: "FAVORITE", label: "Favorites" },
    { key: "WATCHLIST", label: "Watchlist" },
    { key: "READLIST", label: "Readlist" },
    { key: "COMPLETED", label: "Completed" },
    { key: "ON_HOLD", label: "On Hold" },
    { key: "DROPPED", label: "Dropped" },
];

/** The four media categories rendered as carousel rows per collection. */
const MEDIA_CATEGORY_LABELS: Record<MediaItem["type"], string> = {
    comics: "Comics",
    movies: "Movies",
    series: "Series",
    novels: "Novels",
};

/** MediaItem.type for one stored record. */
function mediaTypeFromEntertainmentType(
    type: UserEntertainmentItem["entertainmentType"],
): MediaItem["type"] {
    switch (type) {
        case "COMIC":
            return "comics";
        case "NOVEL":
            return "novels";
        case "MOVIE":
            return "movies";
        case "SERIES":
            return "series";
    }
}

/** Max detail requests resolved in parallel per batch. */
const METADATA_FETCH_CONCURRENCY = 4;

interface CollectionMetadataState {
    /** Successfully fetched items, grouped by media category. */
    readonly itemsByCategory: Partial<Record<MediaItem["type"], MediaItem[]>>;
    /** Record identities whose provider fetch failed, keyed by full identity. */
    readonly failedIdentityKeys: Set<string>;
    readonly isFetching: boolean;
}

/**
 * Resolves every raw collection record of one purpose into real provider
 * metadata. One react-query cache entry per distinct set of record identities,
 * so switching tabs back and forth reuses the cache instead of refetching.
 * Each identity is fetched once even when duplicated across records; provider
 * failures degrade only their own item, never the whole collection.
 */
function useCollectionMetadata(
    records: UserEntertainmentItem[] | undefined,
    isEnabled: boolean,
): CollectionMetadataState {
    const identityKey = useMemo(
        () =>
            (records ?? [])
                .map(entertainmentIdentityKey)
                .sort()
                .join(";"),
        [records],
    );

    const query = useQuery({
        queryKey: ["profile", "collections", "metadata", identityKey],
        queryFn: async () => {
            const recordsByKey = new Map<string, UserEntertainmentItem>();
            for (const record of records ?? []) {
                recordsByKey.set(entertainmentIdentityKey(record), record);
            }

            const identities = [...recordsByKey.entries()];
            const resolved = new Map<
                string,
                MediaItem | null
            >();

            // Bounded concurrency: resolve identities in fixed-size batches
            // so a large collection never fires every request at once.
            for (
                let offset = 0;
                offset < identities.length;
                offset += METADATA_FETCH_CONCURRENCY
            ) {
                const batch = identities.slice(
                    offset,
                    offset + METADATA_FETCH_CONCURRENCY,
                );
                const settled = await Promise.allSettled(
                    batch.map(([, record]) =>
                        fetchEntertainmentMetadata(record),
                    ),
                );
                settled.forEach((outcome, batchIndex) => {
                    const [identityKey] = batch[batchIndex];
                    resolved.set(
                        identityKey,
                        outcome.status === "fulfilled" ? outcome.value : null,
                    );
                });
            }

            const itemsByCategory: Partial<
                Record<MediaItem["type"], MediaItem[]>
            > = {};
            const failedIdentityKeys = new Set<string>();
            for (const [identity, record] of recordsByKey) {
                const metadata = resolved.get(identity);
                if (metadata === undefined || metadata === null) {
                    failedIdentityKeys.add(identity);
                    continue;
                }
                const category = mediaTypeFromEntertainmentType(
                    record.entertainmentType,
                );
                const categoryItems = itemsByCategory[category] ?? [];
                categoryItems.push(metadata);
                itemsByCategory[category] = categoryItems;
            }
            return { itemsByCategory, failedIdentityKeys };
        },
        enabled: isEnabled && (records?.length ?? 0) > 0,
        staleTime: 5 * 60 * 1000,
    });

    return {
        itemsByCategory: query.data?.itemsByCategory ?? {},
        failedIdentityKeys: query.data?.failedIdentityKeys ?? new Set(),
        isFetching: query.isFetching,
    };
}

const CATEGORY_KEYS: readonly MediaItem["type"][] = [
    "comics",
    "movies",
    "series",
    "novels",
];

interface ProfileContentProps {
    /** True when rendering the guest experience (History only). */
    readonly isGuest: boolean;
    /** Raw stored records for the selected collection, with provider identity. */
    readonly collectionRecords?: UserEntertainmentItem[];
    /** Guest browsing history. Empty until guest-history storage exists. */
    readonly guestHistory: MediaItem[];
    readonly selectedCollection?: EntertainmentListType;
    readonly onCollectionChange?: (collection: EntertainmentListType) => void;
    readonly mobileLibrary?: boolean;
    readonly isCollectionLoading?: boolean;
    readonly collectionError?: string;
    readonly onRetryCollection?: () => void;
}

function MediaCategoryRow({
    items,
    label,
    collectionLabel,
}: {
    readonly items: MediaItem[];
    readonly label: string;
    readonly collectionLabel: string;
}) {
    if (items.length === 0) {
        return (
            <EmptyState
                title={`No ${label.toLowerCase()} in ${collectionLabel}`}
                description={`Titles you add to ${collectionLabel} will appear here.`}
            />
        );
    }
    return <MediaCarousel items={items} label={`${collectionLabel} — ${label}`} />;
}

/**
 * Profile main content. Authenticated: collection tab row (7 types) + four
 * media-category rows for the selected collection. Guest: History only.
 */
export function ProfileContent({
    isGuest,
    collectionRecords,
    guestHistory,
    selectedCollection: selectedCollectionProp,
    onCollectionChange,
    mobileLibrary = false,
    isCollectionLoading = false,
    collectionError,
    onRetryCollection,
}: ProfileContentProps) {
    const [internalSelectedCollection, setInternalSelectedCollection] =
        useState<EntertainmentListType>("FAVORITE");
    const selectedCollection = selectedCollectionProp ?? internalSelectedCollection;

    function setSelectedCollection(collection: EntertainmentListType) {
        setInternalSelectedCollection(collection);
        onCollectionChange?.(collection);
    }

    const collectionLabel =
        COLLECTIONS.find((c) => c.key === selectedCollection)?.label ??
        selectedCollection;

    const metadata = useCollectionMetadata(collectionRecords, !isGuest);
    const failedCount = metadata.failedIdentityKeys.size;

    return (
        <div>
            {/* ── Collection navigation (authenticated only) ── */}
            {!isGuest && (
                <nav
                    aria-label="Collections"
                    className={`profile-collection-nav ${mobileLibrary ? "profile-collection-nav--sticky" : ""}`}
                >
                    {COLLECTIONS.map((collection) => {
                        const isSelected = selectedCollection === collection.key;
                        return (
                            <button
                                key={collection.key}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => setSelectedCollection(collection.key)}
                                className={`profile-collection-tab ${
                                    isSelected
                                        ? "profile-collection-tab--selected"
                                        : "profile-collection-tab--unselected"
                                }`}
                            >
                                {collection.label}
                            </button>
                        );
                    })}
                </nav>
            )}

            {/* ── Authenticated: four media-category rows ── */}
            {!isGuest && (
                <div className="profile-collections-body">
                    {isCollectionLoading && (
                        <p className="profile-collections-status" role="status">
                            Loading your collection...
                        </p>
                    )}
                    {collectionError && (
                        <ErrorState
                            message={collectionError}
                            onRetry={onRetryCollection}
                        />
                    )}
                    {failedCount > 0 && !collectionError && (
                        <p className="profile-collections-status" role="status">
                            {failedCount} item{failedCount === 1 ? "" : "s"} could
                            not be loaded.
                        </p>
                    )}
                    {CATEGORY_KEYS.map((category) => (
                        <section
                            key={category}
                            className="profile-collection-row"
                        >
                            <h3 className="sr-only">
                                {collectionLabel} — {MEDIA_CATEGORY_LABELS[category]}
                            </h3>
                            <SectionHeader
                                title={`${MEDIA_CATEGORY_LABELS[category]} — ${collectionLabel}`}
                            />
                            <MediaCategoryRow
                                items={metadata.itemsByCategory[category] ?? []}
                                label={MEDIA_CATEGORY_LABELS[category]}
                                collectionLabel={collectionLabel}
                            />
                        </section>
                    ))}
                </div>
            )}

            {/* ── Guest: History only ── */}
            {isGuest && (
                <section className="profile-guest-section">
                    <SectionHeader
    title="History"
    seeAllHref="/profile/guest"
/>
                    <h3 className="sr-only">Browsing history</h3>
                    {guestHistory.length === 0 ? (
                        <div className="profile-guest-history-slot">
                            <EmptyState
                                title="No browsing history yet"
                                description="Titles you browse will appear here. Sign in to keep your history across devices."
                            />
                        </div>
                    ) : (
                        <MediaCarousel items={guestHistory} label="History" />
                    )}
                </section>
            )}
        </div>
    );
}
