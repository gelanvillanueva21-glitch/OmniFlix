import { SearchBar } from "./SearchBar";
import { ExploreButton } from "./ExploreButton";
import { HeroBackground } from "./HeroBackground";

export function HeroSection() {
    return (
        <section
            className="landing-hero"
            aria-labelledby="hero-headline"
        >
            {/* Background decorative artwork and lighting */}
            <HeroBackground />

            {/* Central content container */}
            <div className="landing-hero-content">
                {/* Small category line above the headline */}
                <p className="landing-hero-category-line">
                    MANGA / MANHWA / NOVELS / MOVIES / SERIES
                </p>

                {/* Main headline split across two lines */}
                <h1
                    id="hero-headline"
                    className="landing-hero-headline"
                >
                    Discover Your Next{" "}
                    <span className="landing-hero-headline-accent">
                        Obsession
                    </span>
                </h1>

                {/* Short description beneath the headline */}
                <p className="landing-hero-description">
                    Find, explore, and enjoy your favorite stories — all in one place.
                </p>

                {/* Centered wide search bar */}
                <div className="landing-hero-search-slot">
                    <SearchBar />
                </div>

                {/* Explore button */}
                <ExploreButton />
            </div>
        </section>
    );
}

