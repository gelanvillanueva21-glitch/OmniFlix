"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MediaItem } from "@/lib/media";
import type { SuwayomiSourceInfo } from "@/service/suwayomi.service";

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
    source: string,
    page: number,
    type: ComicsCatalogType,
    query?: string,
): Promise<ComicsCatalogResponse> {
    const search = new URLSearchParams({ source, page: String(page), type });
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
function dedupeById(items: MediaItem[]): MediaItem[] {
    const seen = new Set<string>();
    return items.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
}

export function useComicsSources() {
    return useQuery({
        queryKey: ["comics", "sources"],
        queryFn: fetchSources,
        staleTime: 5 * 60 * 1000,
    });
}

export function useComicsCatalog(
    activeSourceId: string | null,
    browsePage: number,
    type: ComicsCatalogType,
    query: string,
    isSearchMode: boolean,
) {
    return useQuery({
        queryKey: [
            "comics",
            "catalog",
            activeSourceId,
            type,
            browsePage,
            isSearchMode ? query : null,
        ],
        queryFn: () => {
            if (!activeSourceId) throw new Error("No comic source selected.");
            return fetchCatalog(
                activeSourceId,
                browsePage,
                type,
                isSearchMode ? query : undefined,
            );
        },
        enabled: activeSourceId !== null,
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
export function useComicsBrowseState(defaultSourceId: string | null) {
    const [lastSelectedSourceId, setLastSelectedSourceId] = useState<
        string | null
    >(null);
    const [lastSubmittedQuery, setLastSubmittedQuery] = useState("");
    const [browsePage, setBrowsePage] = useState(1);

    // Reset page and search whenever the effective source actually changes,
    // comparing during render instead of via an effect.
    const effectiveSourceId = lastSelectedSourceId ?? defaultSourceId;
    if (lastSelectedSourceId !== effectiveSourceId) {
        setLastSelectedSourceId(effectiveSourceId);
        setLastSubmittedQuery("");
        setBrowsePage(1);
    }

    const submittedQuery = lastSubmittedQuery;
    const isSearchMode = submittedQuery !== "";

    function handleSearchSubmit(query: string) {
        setBrowsePage(1);
        setLastSubmittedQuery(query);
    }

    function handleClearSearch() {
        setBrowsePage(1);
        setLastSubmittedQuery("");
    }

    return {
        activeSourceId: effectiveSourceId,
        submittedQuery,
        isSearchMode,
        browsePage,
        setSelectedSourceId: setLastSelectedSourceId,
        setBrowsePage,
        handleSearchSubmit,
        handleClearSearch,
    };
}

export function useDedupedCatalogItems(
    catalogQuery: ReturnType<typeof useComicsCatalog>,
) {
    return useMemo(
        () => dedupeById(catalogQuery.data?.items ?? []),
        [catalogQuery.data],
    );
}
