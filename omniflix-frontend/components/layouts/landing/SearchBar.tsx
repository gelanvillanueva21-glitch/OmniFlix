
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
            className={`relative mx-auto w-full ${
                compact ? "max-w-none" : "max-w-175"
            } group`}
            role="search"
            aria-label="Sitewide entertainment search"
        >
            <div
                className={`relative flex w-full items-center rounded-full border border-[#2E2E33] bg-[#1C1C1F]/80 backdrop-blur-md shadow-lg shadow-black/40 transition-all duration-200 hover:border-[#8B5CF6]/40 focus-within:border-[#8B5CF6] focus-within:ring-2 focus-within:ring-[#8B5CF6]/30 ${
                    compact
                        ? "min-h-10 px-2 py-1"
                        : "px-5 py-3.5"
                }`}
            >
                <div
                    className={`flex shrink-0 items-center justify-center text-[#A1A1AA] ${
                        compact ? "mr-1.5" : "mr-3.5"
                    }`}
                    aria-hidden="true"
                >
                    <Image
                        src="/search.svg"
                        alt=""
                        width={20}
                        height={20}
                        className={`opacity-70 invert ${compact ? "h-4 w-4" : ""}`}
                    />
                </div>

                <input
                    type="search"
                    name="query"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={compact ? "Search..." : "Search titles, genres, and more..."}
                    className={`min-w-0 w-full bg-transparent text-sm font-normal text-[#F5F5F5] placeholder-[#71717A] outline-none ${
                        compact ? "pr-7 text-xs" : "pr-12 md:text-base"
                    }`}
                    aria-label="Search entertainment titles, genres, and more"
                    autoComplete="off"
                    spellCheck={false}
                />

                <button
                    type="submit"
                    className={`absolute right-1 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full border border-[#8B5CF6]/40 bg-[#8B5CF6]/20 text-[#F5F5F5] transition-all duration-200 hover:scale-105 hover:bg-[#8B5CF6] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D946EF] ${
                        compact ? "h-7 w-7" : "right-2.5 h-9 w-9"
                    }`}
                    aria-label="Submit search"
                >
                    <Image
                        src="/arrow-right.svg"
                        alt=""
                        width={16}
                        height={16}
                        className="h-3.5 w-3.5 opacity-90 invert"
                    />
                </button>
            </div>
        </form>
    );
}
