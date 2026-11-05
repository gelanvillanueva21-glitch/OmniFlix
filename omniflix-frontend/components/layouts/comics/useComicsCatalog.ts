"use client";

import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { MediaItem } from "@/lib/media";
import type { SuwayomiSourceInfo } from "@/service/suwayomi/suwayomi.service";

export type ComicsCatalogType = "POPULAR" | "SEARCH";

export interface ComicsCatalogResponse {
    items: MediaItem[];
    hasNextPage: boolean;
    error?: string;
}

interface ComicsSourcesResponse {
    sources: SuwayomiSourceInfo[];
}

const COMICS_API = "/api/comics";

async function fetchSources(): Promise<ComicsSourcesResponse> {
    const response = await fetch(`${COMICS_API}?kind=sources`);
    const payload = (await response.json()) as
        | ComicsSourcesResponse
        | { error: string };
    if (!response.ok || !("sources" in payload)) {
        throw new Error(
            ("error" in payload && payload.error) ||
                "Suwayomi is unreachable. Comic sources could not be discovered.",
        );
    }
    return payload;
}

async function fetchCatalog(
    sourceType: string,
    page: number,
    type: ComicsCatalogType,
    query?: string,
): Promise<ComicsCatalogResponse> {
    const search = new URLSearchParams({ sourceType, page: String(page), type });
    if (query) search.set("query", query);
    const response = await fetch(`${COMICS_API}?${search.toString()}`);
    const payload = (await response.json()) as
        | ComicsCatalogResponse
        | { error: string };
    if (!response.ok || !("items" in payload)) {
        throw new Error(
            ("error" in payload && payload.error) ||
                "This source could not be reached right now.",
        );
    }
    return payload;
}

/** Same-title comics from different sources/ids are distinct; exact ids are not. */
export function dedupeById(items: MediaItem[]): MediaItem[] {
    return [...new Map(items.map((item) => [item.id, item])).values()];
}

export function useComicsSources() {
    return useQuery({
        queryKey: ["comics", "sources"],
        queryFn: fetchSources,
        staleTime: 5 * 60 * 1000,
    });
}

export function useComicsInfiniteCatalog(
    activeSourceType: string | null,
    type: ComicsCatalogType,
    query: string,
    isSearchMode: boolean,
) {
    return useInfiniteQuery({
        queryKey: [
            "comics",
            "catalog",
            "infinite",
            activeSourceType,
            type,
            isSearchMode ? query : null,
        ],
        queryFn: ({ pageParam }) => {
            if (!activeSourceType) throw new Error("No comic source selected.");
            return fetchCatalog(
                activeSourceType,
                pageParam,
                type,
                isSearchMode ? query : undefined,
            );
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) =>
            lastPage.hasNextPage ? allPages.length + 1 : undefined,
        enabled: activeSourceType !== null,
        staleTime: 5 * 60 * 1000,
    });
}

export function useComicsCatalog(
    activeSourceType: string | null,
    browsePage: number,
    type: ComicsCatalogType,
    query: string,
    isSearchMode: boolean,
) {
    return useQuery({
        queryKey: [
            "comics",
            "catalog",
            activeSourceType,
            type,
            browsePage,
            isSearchMode ? query : null,
        ],
        queryFn: () => {
            if (!activeSourceType) throw new Error("No comic source selected.");
            return fetchCatalog(
                activeSourceType,
                browsePage,
                type,
                isSearchMode ? query : undefined,
            );
        },
        enabled: activeSourceType !== null,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
        // Same-title comics from different sources/ids are distinct; exact ids are not.
        select: (catalog) => ({
            ...catalog,
            items: dedupeById(catalog.items),
        }),
    });
}

/**
 * Shared browsing state for the comics page: the selected source, the
 * submitted search query, and the current pagination page.
 */
export function useComicsBrowseState(sourceType: string | null) {
    const [submittedQuery, setSubmittedQuery] = useState("");
    const [browsePage, setBrowsePage] = useState(1);

    
    const isSearchMode = submittedQuery !== "";

    function handleSearchSubmit(query: string) {
        setBrowsePage(1);
        setSubmittedQuery(query);
    }

    function handleClearSearch() {
        setBrowsePage(1);
        setSubmittedQuery("");
    }

    return {
        activeSourceType: sourceType,
        submittedQuery,
        isSearchMode,
        browsePage,
        setBrowsePage,
        handleSearchSubmit,
        handleClearSearch,
    };
}
