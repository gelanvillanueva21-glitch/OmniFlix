"use client";

import { useState, type FormEvent } from "react";
import { SearchIcon } from "@/components/icons/icons";

interface SearchBarProps {
    readonly onSubmit?: (query: string) => void;
    readonly onChange?: (query: string) => void;
    readonly value?: string;
    readonly placeholder?: string;
    readonly id?: string;
}

export function SearchBar({
    onSubmit,
    onChange,
    value: controlledValue,
    placeholder = "Search titles, genres…",
    id = "explore-search",
}: SearchBarProps) {
    const [internalQuery, setInternalQuery] = useState("");
    const isControlled = controlledValue !== undefined;
    const query = isControlled ? controlledValue : internalQuery;

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const nextValue = event.target.value;
        if (!isControlled) {
            setInternalQuery(nextValue);
        }
        onChange?.(nextValue);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onSubmit?.(query.trim());
    }

    return (
        <form role="search" onSubmit={handleSubmit} className="relative">
            <label htmlFor={id} className="sr-only">
                Search entertainment
            </label>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#A1A1AA]" />
            <input
                id={id}
                type="search"
                value={query}
                onChange={handleChange}
                placeholder={placeholder}
                autoComplete="off"
                className="w-full rounded-lg border border-[#29292E] bg-[#111111] py-2 pr-3 pl-9 text-sm text-[#F5F5F5] placeholder:text-[#A1A1AA] transition-colors focus:border-[#8B5CF6] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#8B5CF6]"
            />
        </form>
    );
}
