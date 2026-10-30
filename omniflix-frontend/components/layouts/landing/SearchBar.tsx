
"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";

interface SearchBarProps {
    readonly onSearchSubmit?: (searchQuery: string) => void;
    readonly compact?: boolean;
}

export function SearchBar({
    onSearchSubmit,
    compact = false,
}: SearchBarProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedQuery = searchQuery.trim();

        if (onSearchSubmit) {
            onSearchSubmit(trimmedQuery);
        }
    };

    return (
        <form
            onSubmit={handleFormSubmit}
            className={`landing-searchbar ${
                compact ? "landing-searchbar--compact" : "landing-searchbar--full"
            }`}
            role="search"
            aria-label="Sitewide entertainment search"
        >
            <div
                className={`landing-searchbar-field ${
                    compact
                        ? "landing-searchbar-field--compact"
                        : "landing-searchbar-field--full"
                }`}
            >
                <div
                    className={`landing-searchbar-icon-slot ${
                        compact ? "landing-searchbar-icon-slot--compact" : "landing-searchbar-icon-slot--full"
                    }`}
                    aria-hidden="true"
                >
                    <Image
                        src="/search.svg"
                        alt=""
                        width={20}
                        height={20}
                        className={`landing-searchbar-icon ${compact ? "landing-searchbar-icon--compact" : ""}`}
                    />
                </div>

                <input
                    type="search"
                    name="query"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={compact ? "Search..." : "Search titles, genres, and more..."}
                    className={`landing-searchbar-input ${
                        compact ? "landing-searchbar-input--compact" : "landing-searchbar-input--full"
                    }`}
                    aria-label="Search entertainment titles, genres, and more"
                    autoComplete="off"
                    spellCheck={false}
                />

                <button
                    type="submit"
                    className={`landing-searchbar-submit ${
                        compact ? "landing-searchbar-submit--compact" : "landing-searchbar-submit--full"
                    }`}
                    aria-label="Submit search"
                >
                    <Image
                        src="/arrow-right.svg"
                        alt=""
                        width={16}
                        height={16}
                        className="landing-searchbar-submit-icon"
                    />
                </button>
            </div>
        </form>
    );
}
