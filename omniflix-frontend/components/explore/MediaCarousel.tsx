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
export function MediaCarousel({ items, label }: MediaCarouselProps) {
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
        <div className="relative" role="region" aria-label={label}>
            <ul
                ref={trackRef}
                className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="list"
            >
                {items.map((item) => (
                    <li
                        key={item.id}
                        className="w-36 shrink-0 snap-start sm:w-44"
                    >
                        <MediaCard media={item} />
                    </li>
                ))}
            </ul>

            <button
                type="button"
                onClick={() => scrollByCard(-1)}
                aria-label={`Scroll ${label} backward`}
                className="absolute top-1/3 -left-3 z-10 hidden h-9 w-9 items-center justify-center rounded-full border border-[#29292E] bg-[#171719]/90 text-[#F5F5F5] transition-colors hover:bg-[#242429] focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:outline-none md:inline-flex"
            >
                <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => scrollByCard(1)}
                aria-label={`Scroll ${label} forward`}
                className="absolute top-1/3 -right-3 z-10 hidden h-9 w-9 items-center justify-center rounded-full border border-[#29292E] bg-[#171719]/90 text-[#F5F5F5] transition-colors hover:bg-[#242429] focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:outline-none md:inline-flex"
            >
                <ChevronRightIcon className="h-4 w-4" />
            </button>
        </div>
    );
}
