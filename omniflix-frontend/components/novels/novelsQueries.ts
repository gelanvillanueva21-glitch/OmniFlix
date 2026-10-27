"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { MediaItem } from "@/lib/media";

const NOVELS_API = "/api/novel";
const POPULAR_NOVELS_API = "/api/novel/popular";
const NOVEL_SEARCH_API = "/api/novel/search";
export const NOVELS_PAGE_SIZE = 12;

interface NovelsPageResponse {
  items: MediaItem[];
  hasNextPage: boolean;
}

async function fetchNovelsPage(page: number): Promise<NovelsPageResponse> {
  const search = new URLSearchParams({
    limit: String(NOVELS_PAGE_SIZE),
    page: String(page),
  });
  const response = await fetch(`${NOVELS_API}?${search.toString()}`);
  const payload = (await response.json()) as
    | NovelsPageResponse
    | { error: string };
  if (!response.ok || !("items" in payload)) {
    throw new Error(
      ("error" in payload && payload.error) ||
        "The novel provider is unavailable right now.",
    );
  }
  return payload;
}

/** Same novel id on consecutive pages is a duplicate; exact ids are not. */
export function dedupeById(items: MediaItem[]): MediaItem[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

export function useNovels() {
  return useInfiniteQuery({
    queryKey: ["novels", "catalog"],
    queryFn: ({ pageParam }) => fetchNovelsPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasNextPage ? allPages.length + 1 : undefined,
    staleTime: 5 * 60 * 1000,
  });
}

async function searchNovels(query: string): Promise<MediaItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const search = new URLSearchParams({ query: trimmed });
  const response = await fetch(`${NOVEL_SEARCH_API}?${search.toString()}`);
  const payload = (await response.json()) as
    | { items: MediaItem[] }
    | { error: string };
  if (!response.ok || !("items" in payload)) {
    throw new Error(
      ("error" in payload && payload.error) ||
        "The novel provider is unavailable right now.",
    );
  }
  return payload.items;
}

/**
 * Debounced-query novel search for the Novels Explore section — the exact
 * Movies/Series search pattern (per-query cache entry, no stale-result
 * flashes). LNcrawl searches every source indexed on the server, so newly
 * added sources are searchable without frontend changes.
 */
export function useNovelSearch(query: string) {
  return useQuery({
    queryKey: ["novels", "search", query],
    queryFn: () => searchNovels(query),
    enabled: query.trim().length > 0,
    staleTime: 60 * 1000,
  });
}

async function fetchPopularNovels(): Promise<MediaItem[]> {
  const response = await fetch(POPULAR_NOVELS_API);
  const payload = (await response.json()) as
    | { novels: MediaItem[] }
    | { error: string };
  if (!response.ok || !("novels" in payload)) {
    throw new Error(
      ("error" in payload && payload.error) ||
        "The novel provider is unavailable right now.",
    );
  }
  return dedupeById(payload.novels);
}

/** Popularity-ranked novels from the provider, served by /api/novel/popular. */
export function usePopularNovels() {
  return useQuery({
    queryKey: ["novels", "popular"],
    queryFn: fetchPopularNovels,
    staleTime: 5 * 60 * 1000,
  });
}
