"use client";

import { useRef } from "react";
import { MediaCard } from "./MediaCard";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons/icons";
import type { MediaItem } from "@/lib/media";

interface MediaCarouselProps {
    readonly items: MediaItem[];
    readonly label: string;
}

/**
 * Horizontal scroll row with keyboard focusability and scroll-snap. Plain
 * overflow scrolling (no slider library) keeps it accessible and simple.
 */
export function MediaCarousel({
    items,
    label,
}: MediaCarouselProps) {
    const trackRef = useRef<HTMLUListElement>(null);

    function scrollByCard(direction: 1 | -1) {
        const track = trackRef.current;
        if (!track) return;
        // One "card + gap" unit; first child is the smallest reliable measure.
        const firstCard = track.children[0] as HTMLElement | undefined;
        const unit = firstCard ? firstCard.offsetWidth + 16 : 300;
        track.scrollBy({ left: direction * unit, behavior: "smooth" });
    }

    if (items.length === 0) return null;

    return (
        <div className="media-carousel" role="region" aria-label={label}>
            <ul
                ref={trackRef}
                className="media-carousel-track"
                role="list"
            >
                {items.map((item) => (
                    <li
                        key={item.id}
                        className="media-carousel-item"
                    >
                        <MediaCard
                            media={item}
                        />
                    </li>
                ))}
            </ul>

            <button
                type="button"
                onClick={() => scrollByCard(-1)}
                aria-label={`Scroll ${label} backward`}
                className="media-carousel-arrow media-carousel-arrow--left"
            >
                <ChevronLeftIcon className="media-carousel-arrow-icon" />
            </button>
            <button
                type="button"
                onClick={() => scrollByCard(1)}
                aria-label={`Scroll ${label} forward`}
                className="media-carousel-arrow media-carousel-arrow--right"
            >
                <ChevronRightIcon className="media-carousel-arrow-icon" />
            </button>
        </div>
    );
}
