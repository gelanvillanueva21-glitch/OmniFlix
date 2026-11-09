"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { StarIcon, ImageIcon } from "@/components/icons/icons";
import {
    mediaHref,
    mediaTypeLabel,
    type MediaItem,
    type MediaType,
} from "@/lib/media";
import { saveActivityGuestData } from "@/service/guest.service";
import { saveActivityHistory } from "@/service/profile.service";
import { useAuth } from "@/components/AuthProvider";
import type { EntertainmentType } from "@/service/types/profile.payload";

const entertainmentTypeByMediaType: Record<MediaType, EntertainmentType> = {
    comics: "COMIC",
    novels: "NOVEL",
    movies: "MOVIE",
    series: "SERIES",
};

interface MediaCardProps {
    readonly media: MediaItem;
    /** "poster" for grid/carousel cards, "wide" for the featured banner. */
    readonly variant?: "poster" | "wide";
}

/**
 * Presentation-only card. All data arrives via props; nothing is hardcoded.
 * Image failures degrade to a neutral placeholder — the UI never depends on
 * a specific image host.
 *
 * Navigation: the whole card surface links to the detail route derived from
 * `MediaItem.type` + `MediaItem.id` via `mediaHref`. Malformed ids or
 * unsupported types render the card without a link instead of navigating.
 */
export function MediaCard({
    media,
    variant = "poster",
}: MediaCardProps) {
    const [imageFailed, setImageFailed] = useState(false);
    const showImage = media.coverImage !== undefined && !imageFailed;

    const href = mediaHref(media);
    const { user } = useAuth();

    function handleClick() {
        const entertainmentType = entertainmentTypeByMediaType[media.type];
        const apiSource = media.source.toLowerCase();

        if (user !== null) {
            // Logged in — persist the activity server-side. Best effort:
            // a failed write must never block navigation.
            void saveActivityHistory({
                externalId: media.id,
                apiSource,
                type: entertainmentType,
            }).catch((error) => {
                console.error("Activity could not be recorded", error);
            });
            return;
        }

        saveActivityGuestData({
            externalId: media.id,
            apiSource,
            entertainmentType,
        });
    }

    const sourceLabel =
        media.sourceLabel ??
        (media.source.toLowerCase() === "tmdb"
            ? "TMDB"
            : media.source.toLowerCase() === "jikan"
                ? "Anime"
                : media.source.toLowerCase() === "lncrawl"
                    ? mediaTypeLabel("novels")
                    : media.source.toLowerCase() === "suwayomi"
                        ? mediaTypeLabel("comics")
                        : media.source);

    const metadataParts = [
        sourceLabel,
        media.releaseYear !== undefined ? String(media.releaseYear) : null,
    ].filter((part): part is string => part !== null);

    const cardBody = variant === "wide" ? (
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
    ) : (
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

    if (!href) {
        return cardBody;
    }

    // One wrapping link covers the entire card: real link semantics, keyboard
    // focusable, and no nested interactive elements (the card body has none).
    return (
        <Link
            href={href}
            className="media-card-link"
            onClick={handleClick}
        >
            {cardBody}
        </Link>
    );
}
