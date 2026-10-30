"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "@/components/icons/icons";
import { mediaTypeLabel, type MediaItem } from "@/lib/media";
import { ErrorState } from "./SectionHeader";

interface PopularContentListProps {
    readonly title: string;
    readonly items: MediaItem[];
    readonly error?: string;
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
}: PopularContentListProps) {
    return (
        <section aria-label={title} className="popular-list">
            <h2 className="popular-list-title">
                {title}
            </h2>
            {items.length === 0 && error !== undefined ? (
                <ErrorState message={error} />
            ) : items.length === 0 ? (
                <p className="popular-list-empty">Nothing to show yet.</p>
            ) : (
                <ol role="list" className="popular-list-items">
                    {items.slice(0, 5).map((item, index) => (
                        <PopularListItem
                            key={item.id}
                            item={item}
                            rank={index + 1}
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
}: {
    item: MediaItem;
    rank: number;
}) {
    const [imageFailed, setImageFailed] = useState(false);
    const showImage = item.coverImage !== undefined && !imageFailed;

    return (
        <li className="popular-list-item">
            <span
                aria-hidden="true"
                className="popular-list-rank"
            >
                {rank}
            </span>
            <div className="popular-list-thumbnail">
                {showImage ? (
                    <Image
                        src={item.coverImage as string}
                        alt=""
                        fill
                        sizes="32px"
                        className="popular-list-thumbnail-image"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <div className="popular-list-thumbnail-placeholder">
                        <ImageIcon className="popular-list-thumbnail-placeholder-icon" />
                    </div>
                )}
            </div>
            <div className="popular-list-item-caption">
                <p className="popular-list-item-title" title={item.title}>
                    {item.title}
                </p>
                <p className="popular-list-item-type">
                    {mediaTypeLabel(item.type)}
                </p>
            </div>
        </li>
    );
}
