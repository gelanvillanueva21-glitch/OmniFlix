import { SearchBar } from "./SearchBar";
import { ExploreButton } from "./ExploreButton";
import { HeroBackground } from "./HeroBackground";

export function HeroSection() {
    return (
        <section
            className="relative flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-6 overflow-hidden"
            aria-labelledby="hero-headline"
        >
            {/* Background decorative artwork and lighting */}
            <HeroBackground />

            {/* Central content container */}
            <div className="relative z-10 w-full max-w-840px mx-auto text-center flex flex-col items-center -mt-8 md:-mt-12">
                {/* Small category line above the headline */}
                <p className="text-xs md:text-sm uppercase tracking-[0.22em] text-[#A1A1AA] font-medium mb-5 select-none">
                    MANGA / MANHWA / NOVELS / MOVIES / SERIES
                </p>

                {/* Main headline split across two lines */}
                <h1
                    id="hero-headline"
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] text-[#F5F5F5] mb-5 font-sans"
                >
                    Discover Your Next{" "}
                    <span className="block mt-1 sm:mt-2 bg-linear-to-r from-[#8B5CF6] via-[#A855F7] to-[#D946EF] bg-clip-text text-transparent pb-1">
                        Obsession
                    </span>
                </h1>

                {/* Short description beneath the headline */}
                <p className="text-base sm:text-lg text-[#A1A1AA] max-w-620px font-normal leading-relaxed mb-9">
                    Find, explore, and enjoy your favorite stories — all in one place.
                </p>

                {/* Centered wide search bar */}
                <div className="w-full mb-6">
                    <SearchBar />
                </div>

                {/* Explore button */}
                <ExploreButton />
            </div>
        </section>
    );
}

