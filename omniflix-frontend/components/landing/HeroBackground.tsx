interface HeroArtworkSlot {
    readonly id: string;
    readonly src?: string;
    readonly alt?: string;
    readonly positionClasses: string;
    readonly rotationClasses?: string;
}

/**
 * Slot configuration for optional background artwork images.
 * 
 * To add background artwork:
 * 1. Place image files in `public/images/hero/` (e.g. `left-top.jpg`, `right-top.jpg`).
 * 2. Set the `src` property on any slot below to `"/images/hero/left-top.jpg"`.
 * 3. When `src` is omitted or empty, the slot gracefully displays nothing, keeping
 *    the cinematic charcoal-black background clean and distraction-free.
 */
const ARTWORK_SLOTS: readonly HeroArtworkSlot[] = [
    {
        id: "left-top",
        src: undefined, // Example future: "/images/hero/left-top.jpg"
        alt: "Comics artwork",
        positionClasses: "top-[12%] -left-12 w-64 h-88 xl:w-72 xl:h-96",
        rotationClasses: "-rotate-6",
    },
    {
        id: "left-bottom",
        src: undefined, // Example future: "/images/hero/left-bottom.jpg"
        alt: "Manhwa artwork",
        positionClasses: "bottom-[8%] left-4 w-60 h-80 xl:w-68 xl:h-92",
        rotationClasses: "rotate-3",
    },
    {
        id: "right-top",
        src: undefined, // Example future: "/images/hero/right-top.jpg"
        alt: "Movie artwork",
        positionClasses: "top-[14%] -right-10 w-64 h-88 xl:w-72 xl:h-96",
        rotationClasses: "rotate-6",
    },
    {
        id: "right-bottom",
        src: undefined, // Example future: "/images/hero/right-bottom.jpg"
        alt: "Series artwork",
        positionClasses: "bottom-[6%] right-6 w-60 h-80 xl:w-68 xl:h-92",
        rotationClasses: "-rotate-3",
    },
];

export function HeroBackground() {
    return (
        <div
            className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
            aria-hidden="true"
        >
            {/* Base atmospheric radial gradient for soft purple glow in the center */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#8B5CF6]/[0.07] via-transparent to-transparent" />

            {/* Optional collage images positioned around the edges */}
            {ARTWORK_SLOTS.map((slot) => {
                if (!slot.src) {
                    return null;
                }

                return (
                    <div
                        key={slot.id}
                        className={`absolute rounded-2xl overflow-hidden border border-[#27272A]/40 shadow-2xl opacity-40 hover:opacity-60 transition-opacity duration-500 ${slot.positionClasses} ${slot.rotationClasses ?? ""}`}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={slot.src}
                            alt={slot.alt ?? "Hero Artwork"}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                        {/* Dark gradient overlay on individual images to fade into background */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/30 to-transparent" />
                    </div>
                );
            })}

            {/* Global vignettes to guarantee text legibility in the center */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#111111] via-transparent to-[#111111] opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/40 via-transparent to-[#111111]" />
        </div>
    );
}

