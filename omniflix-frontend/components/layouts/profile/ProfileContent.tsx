"use client";

import { useState } from "react";
import { MediaCarousel } from "@/components/MediaCarousel";
import {
    SectionHeader,
    EmptyState,
    ErrorState,
} from "@/components/SectionHeader";
import type { MediaItem } from "@/lib/media";
import type { EntertainmentListType } from "@/service/types/profile.payload";

/** The seven collections, matching EntertainmentListType in the Prisma schema. */
const COLLECTIONS: readonly { key: EntertainmentListType; label: string }[] = [
    { key: "FAVORITE", label: "Favorites" },
    { key: "WATCHLIST", label: "Watchlist" },
    { key: "COMPLETED", label: "Completed" },
    { key: "ON_HOLD", label: "On Hold" },
    { key: "PLAN_TO_WATCH", label: "Plan to Watch" },
    { key: "PLAN_TO_READ", label: "Plan to Read" },
    { key: "DROPPED", label: "Dropped" },
];

/** The four media categories rendered as carousel rows per collection. */
const MEDIA_CATEGORY_LABELS: Record<MediaItem["type"], string> = {
    comics: "Comics",
    movies: "Movies",
    series: "Series",
    novels: "Novels",
};

const CATEGORY_KEYS: readonly MediaItem["type"][] = [
    "comics",
    "movies",
    "series",
    "novels",
];

interface ProfileContentProps {
    /** True when rendering the guest experience (History only). */
    readonly isGuest: boolean;
    /** Authenticated collections per purpose, grouped by media category. */
    readonly collections?: Record<
        EntertainmentListType,
        Partial<Record<MediaItem["type"], MediaItem[]>>
    >;
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
    collections,
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

    const selectedItems = collections?.[selectedCollection] ?? {};

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
                                items={selectedItems[category] ?? []}
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
                    <SectionHeader title="History" />
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
