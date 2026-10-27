


"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { dedupeById } from "@/components/explore/discoverQueries";
import type { CatalogQueryLike } from "@/components/comics/SearchResultsSection";
import type { MediaItem } from "@/lib/media";

const SEARCH_API = "/api/search";
/** Live search needs fresh results per keystroke; nothing is worth caching. */
const NO_STALE_TIME = 0;

interface GlobalSearchResponse {
    items: MediaItem[];
    hasNextPage: boolean;
    error?: string;
}

export interface GlobalSearchResult {
    items: MediaItem[];
    /** True while any provider still reports more pages past this first set. */
    hasNextPage: boolean;
    /** Set when one or more providers failed but others succeeded. */
    providerError?: string;
    /** True while the debounce has not caught up with the current input. */
    isWaitingForDebounce: boolean;
    /** Shaped for the shared SearchResultsSection component. */
    catalogQuery: CatalogQueryLike;
}

/**
 * Global Explore search. The query is debounced upstream; TanStack Query's
 * per-key cache entries guarantee that an older in-flight response for a
 * previous query can never overwrite a newer one (each query string gets its
 * own entry, and the placeholder keeps the previous results visible while the
 * next page loads — keyed data never mixes).
 */
export function useGlobalSearch(
    debouncedQuery: string,
    currentQuery: string,
    isSearchMode: boolean,
): GlobalSearchResult {
    const searchQuery = useQuery({
        queryKey: [
            "explore", 
            "search", 
            debouncedQuery
        ],
        queryFn: async ({ signal }): Promise<GlobalSearchResponse> => {
            const params = new URLSearchParams(
                { query: debouncedQuery }
            );
            const response = await fetch(
                `${SEARCH_API}?${params.toString()}`, 
                {
                    signal,
                }
            );
            const payload = (await response.json()) as
                | GlobalSearchResponse
                | { error: string };
            if (!response.ok || !("items" in payload)) {
                throw new Error(
                ("error" in payload && payload.error) ||
                    "Search is unavailable right now.",
                );
            }
            return payload;
        },
        enabled: isSearchMode && debouncedQuery.length > 0,
        staleTime: NO_STALE_TIME,
        placeholderData: keepPreviousData,
    });

    const isWaitingForDebounce = isSearchMode && debouncedQuery !== currentQuery;

    const result: GlobalSearchResult = {
        items: isWaitingForDebounce
        ? []
        : dedupeById(
            searchQuery.data?.items 
            ?? []
        ),
        hasNextPage: 
            searchQuery.data?.hasNextPage ?? false,
        providerError: 
            searchQuery.data?.error,
            isWaitingForDebounce,
        catalogQuery: {
            isPending: 
                searchQuery.isPending || 
                isWaitingForDebounce,
            isFetching: 
                searchQuery.isFetching || 
                isWaitingForDebounce,
            hasNextPage: 
                searchQuery.data?.hasNextPage ?? false,
            isFetchingNextPage: 
                false,
            error: searchQuery.error,
            refetch: () => searchQuery.refetch(),
        },
    };
    return result;
}
