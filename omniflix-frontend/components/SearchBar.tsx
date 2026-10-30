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
        <form role="search" onSubmit={handleSubmit} className="searchbar">
            <label htmlFor={id} className="searchbar-label">
                Search entertainment
            </label>
            <SearchIcon className="searchbar-icon" />
            <input
                id={id}
                type="search"
                value={query}
                onChange={handleChange}
                placeholder={placeholder}
                autoComplete="off"
                className="searchbar-input"
            />
        </form>
    );
}
