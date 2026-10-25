"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { MediaItem } from "@/lib/media";

const NOVELS_API = "/api/novel";
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
