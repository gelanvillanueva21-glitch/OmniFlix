"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { MediaItem } from "@/lib/media";

const NOVELS_API = "/api/novel";
const POPULAR_NOVELS_API = "/api/novel/popular";
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
