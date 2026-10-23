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

    const metadataParts = [
        mediaTypeLabel(media.type),
        media.releaseYear !== undefined ? String(media.releaseYear) : null,
    ].filter((part): part is string => part !== null);

    if (variant === "wide") {
        return (
            <article className="group relative w-full overflow-hidden rounded-xl border border-[#29292E] bg-[#171719]">
                <div className="relative aspect-12/5 w-full">
                    {showImage ? (
                        <Image
                            src={media.coverImage as string}
                            alt=""
                            fill
                            sizes="(max-width: 1280px) 100vw, 900px"
                            className="object-cover"
                            onError={() => setImageFailed(true)}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-surface-secondary text-text-muted">
                            <ImageIcon className="h-10 w-10" />
                        </div>
                    )}
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-linear-to-t from-[#111111] via-[#111111]/55 to-transparent"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                        <p className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-text-muted">
                            {metadataParts.map((part) => (
                                <span
                                    key={part}
                                    className="rounded-full border border-[#29292E] bg-[#111111]/70 px-2.5 py-0.5"
                                >
                                    {part}
                                </span>
                            ))}
                        </p>
                        <h3 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[#F5F5F5] sm:text-3xl">
                            {media.title}
                        </h3>
                        {media.description !== undefined && (
                            <p className="mt-2 max-w-prose line-clamp-2 text-sm text-[#A1A1AA] sm:line-clamp-3">
                                {media.description}
                            </p>
                        )}
                    </div>
                </div>
            </article>
        );
    }

    return (
        <article className="group flex flex-col gap-2">
            <div className="relative aspect-2/3 w-full overflow-hidden rounded-lg border border-[#29292E] bg-surface-secondary">
                {showImage ? (
                    <Image
                        src={media.coverImage as string}
                        alt={`Cover of ${media.title}`}
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 1280px) 30vw, 200px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-text-muted">
                        <ImageIcon className="h-8 w-8" />
                    </div>
                )}
                {media.rating !== undefined && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#111111]/80 px-2 py-0.5 text-xs font-medium text-[#F5F5F5] backdrop-blur-sm">
                        <StarIcon className="h-3 w-3 text-[#8B5CF6]" />
                        {media.rating.toFixed(1)}
                    </span>
                )}
            </div>
            <div className="min-w-0">
                <h3
                    className="truncate text-sm font-medium text-[#F5F5F5] transition-colors group-hover:text-[#A78BFA]"
                    title={media.title}
                >
                    {media.title}
                </h3>
                <p className="truncate text-xs text-[#A1A1AA]">
                    {mediaTypeLabel(media.type)}
                </p>
            </div>
        </article>
    );
}
