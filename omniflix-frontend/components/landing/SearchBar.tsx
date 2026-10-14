"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";

interface SearchBarProps {
    readonly onSearchSubmit?: (searchQuery: string) => void;
}

export function SearchBar({ onSearchSubmit }: SearchBarProps) {
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
            className="w-full max-w-175 mx-auto relative group"
            role="search"
            aria-label="Sitewide entertainment search"
        >
            <div className="relative flex items-center w-full rounded-full bg-[#1C1C1F]/80 border border-[#2E2E33] hover:border-[#8B5CF6]/40 focus-within:border-[#8B5CF6] focus-within:ring-2 focus-within:ring-[#8B5CF6]/30 backdrop-blur-md shadow-lg shadow-black/40 transition-all duration-200 px-5 py-3.5">
                {/* Left search icon */}
                <div className="flex items-center justify-center text-[#A1A1AA] mr-3.5 shrink-0" aria-hidden="true">
                    <Image
                        src="/search.svg"
                        alt=""
                        width={20}
                        height={20}
                        className="opacity-70 invert"
                    />
                </div>

                {/* Input field */}
                <input
                    type="search"
                    name="query"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search titles, genres, and more..."
                    className="w-full bg-transparent text-[#F5F5F5] placeholder-[#71717A] text-sm md:text-base outline-none pr-12 font-normal"
                    aria-label="Search entertainment titles, genres, and more"
                    autoComplete="off"
                    spellCheck="false"
                />

                {/* Right circular purple-tinted arrow submit button */}
                <button
                    type="submit"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#8B5CF6]/20 hover:bg-[#8B5CF6] border border-[#8B5CF6]/40 flex items-center justify-center text-[#F5F5F5] transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D946EF]"
                    aria-label="Submit search"
                >
                    <Image
                        src="/arrow-right.svg"
                        alt=""
                        width={16}
                        height={16}
                        className="opacity-90 invert"
                    />
                </button>
            </div>
        </form>
    );
}

