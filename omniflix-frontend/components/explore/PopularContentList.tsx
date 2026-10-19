"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "@/components/icons/icons";
import { isRestrictedMedia } from "@/lib/content-visibility";
import { mediaTypeLabel, type MediaItem } from "@/lib/media";
import { ErrorState } from "./SectionHeader";

interface PopularContentListProps {
    readonly title: string;
    readonly items: MediaItem[];
    readonly error?: string;
    readonly blurRestrictedContent?: boolean;
}

/**
 * Compact vertical list for the right sidebar. Shows rating only when the
 * data source supplies it — popular mock data intentionally omits it so we
 * don't present fabricated popularity as real.
 */
export function PopularContentList({
    title,
    items,
    error,
    blurRestrictedContent = false,
}: PopularContentListProps) {
    return (
        <section aria-label={title} className="space-y-3">
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-sm font-semibold tracking-wide text-[#F5F5F5]">
                {title}
            </h2>
            {items.length === 0 && error !== undefined ? (
                <ErrorState message={error} />
            ) : items.length === 0 ? (
                <p className="text-xs text-[#A1A1AA]">Nothing to show yet.</p>
            ) : (
                <ol role="list" className="space-y-2.5">
                    {items.slice(0, 5).map((item, index) => (
                        <PopularListItem
                            key={item.id}
                            item={item}
                            rank={index + 1}
                            blurCover={
                                blurRestrictedContent && isRestrictedMedia(item)
                            }
                        />
                    ))}
                </ol>
            )}
        </section>
    );
}

function PopularListItem({
    item,
    rank,
    blurCover,
}: {
    item: MediaItem;
    rank: number;
    blurCover: boolean;
}) {
    const [imageFailed, setImageFailed] = useState(false);
    const showImage = item.coverImage !== undefined && !imageFailed;

    return (
        <li className="flex items-center gap-3">
            <span
                aria-hidden="true"
                className="w-4 shrink-0 text-center font-[family-name:var(--font-space-grotesk)] text-sm font-semibold text-[#A1A1AA]"
            >
                {rank}
            </span>
            <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded border border-[#29292E] bg-surface-secondary">
                {showImage ? (
                    <Image
                        src={item.coverImage as string}
                        alt=""
                        fill
                        sizes="32px"
                        className={`object-cover ${blurCover ? "scale-110 blur-md" : ""}`}
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-text-muted">
                        <ImageIcon className="h-3 w-3" />
                    </div>
                )}
            </div>
            <div className="min-w-0">
                <p className="truncate text-sm text-[#F5F5F5]" title={item.title}>
                    {item.title}
                </p>
                <p className="truncate text-xs text-[#A1A1AA]">
                    {mediaTypeLabel(item.type)}
                </p>
            </div>
        </li>
    );
}
