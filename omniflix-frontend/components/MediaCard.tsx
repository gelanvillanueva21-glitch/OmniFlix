"use client";

import { useState } from "react";
import Image from "next/image";
import { StarIcon, ImageIcon } from "@/components/icons/icons";
import { mediaTypeLabel, type MediaItem } from "@/lib/media";

interface MediaCardProps {
    readonly media: MediaItem;
    /** "poster" for grid/carousel cards, "wide" for the featured banner. */
    readonly variant?: "poster" | "wide";
}

/**
 * Presentation-only card. All data arrives via props; nothing is hardcoded.
 * Image failures degrade to a neutral placeholder — the UI never depends on
 * a specific image host.
 */
export function MediaCard({
    media,
    variant = "poster",
}: MediaCardProps) {
    const [imageFailed, setImageFailed] = useState(false);
    const showImage = media.coverImage !== undefined && !imageFailed;

    const sourceLabel = media.source
        ? (media.source.toLowerCase() === "tmdb"
            ? "TMDB"
            : media.source.toLowerCase() === "jikan" || media.source.toLowerCase() === "anime"
            ? "Anime"
            : media.source)
        : mediaTypeLabel(media.type);

    const metadataParts = [
        sourceLabel,
        media.releaseYear !== undefined ? String(media.releaseYear) : null,
    ].filter((part): part is string => part !== null);

    if (variant === "wide") {
        return (
            <article className="media-card-wide">
                <div className="media-card-wide-frame">
                    {showImage ? (
                        <Image
                            src={media.coverImage as string}
                            alt=""
                            fill
                            sizes="(max-width: 1280px) 100vw, 900px"
                            className="media-card-wide-image"
                            onError={() => setImageFailed(true)}
                        />
                    ) : (
                        <div className="media-card-wide-image-placeholder">
                            <ImageIcon className="media-card-wide-placeholder-icon" />
                        </div>
                    )}
                    <div
                        aria-hidden="true"
                        className="media-card-wide-overlay"
                    />
                    <div className="media-card-wide-content">
                        <p className="media-card-wide-metadata">
                            {metadataParts.map((part) => (
                                <span
                                    key={part}
                                    className="media-card-wide-metadata-part"
                                >
                                    {part}
                                </span>
                            ))}
                        </p>
                        <h3 className="media-card-wide-title">
                            {media.title}
                        </h3>
                        {media.description !== undefined && (
                            <p className="media-card-wide-description">
                                {media.description}
                            </p>
                        )}
                    </div>
                </div>
            </article>
        );
    }

    return (
        <article className="media-card-poster">
            <div className="media-card-poster-frame">
                {showImage ? (
                    <Image
                        src={media.coverImage as string}
                        alt={`Cover of ${media.title}`}
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 1280px) 30vw, 200px"
                        className="media-card-poster-image"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <div className="media-card-poster-placeholder">
                        <ImageIcon className="media-card-poster-placeholder-icon" />
                    </div>
                )}
                {media.rating !== undefined && (
                    <span className="media-card-poster-rating">
                        <StarIcon className="media-card-poster-rating-icon" />
                        {media.rating.toFixed(1)}
                    </span>
                )}
            </div>
            <div className="media-card-poster-caption">
                <h3
                    className="media-card-poster-title"
                    title={media.title}
                >
                    {media.title}
                </h3>
                <p className="media-card-poster-source">
                    {sourceLabel}
                </p>
            </div>
        </article>
    );
}
