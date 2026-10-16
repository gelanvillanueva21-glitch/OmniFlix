"use client";

import { useState } from "react";
import { MediaCarousel } from "@/components/explore/MediaCarousel";
import { SectionHeader, EmptyState } from "@/components/explore/SectionHeader";
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

/** TODO: wire these to the collections API when it exists — no mock data. */
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
                description={`Titles you add to ${collectionLabel} will appear here once the collections API is connected.`}
            />
        );
    }
    return <MediaCarousel items={items} label={`${collectionLabel} — ${label}`} />;
}

/**
 * Profile main content. Authenticated: collection tab row (7 types) + four
 * media-category rows for the selected collection. Guest: History only.
 */
export function ProfileContent({ isGuest, collections, guestHistory }: ProfileContentProps) {
    const [selectedCollection, setSelectedCollection] =
        useState<EntertainmentListType>("FAVORITE");

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
                    className="mb-8 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {COLLECTIONS.map((collection) => {
                        const isSelected = selectedCollection === collection.key;
                        return (
                            <button
                                key={collection.key}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => setSelectedCollection(collection.key)}
                                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${
                                    isSelected
                                        ? "bg-[#8B5CF6] text-white"
                                        : "border border-[#29292E] text-[#A1A1AA] hover:border-[#8B5CF6]/60 hover:bg-[#8B5CF6]/10 hover:text-[#F5F5F5]"
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
                <div className="space-y-8">
                    {CATEGORY_KEYS.map((category) => (
                        <section
                            key={category}
                            className="space-y-4"
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
                <section className="space-y-4">
                    <SectionHeader title="History" />
                    <h3 className="sr-only">Browsing history</h3>
                    {guestHistory.length === 0 ? (
                        <EmptyState
                            title="No browsing history yet"
                            description="Titles you browse will appear here. Sign in to keep your history across devices."
                        />
                    ) : (
                        <MediaCarousel items={guestHistory} label="History" />
                    )}
                </section>
            )}
        </div>
    );
}
