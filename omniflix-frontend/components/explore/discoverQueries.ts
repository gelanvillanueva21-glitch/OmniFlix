"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { MediaItem } from "@/lib/media";
import type { ExploreData } from "@/lib/explore";

const DISCOVER_API = "/api/explore/discover";

interface DiscoverContentResponse {
  items: MediaItem[];
  hasNextPage: boolean;
}

async function fetchDiscoverPage(
  page: number,
): Promise<DiscoverContentResponse> {
  const search = new URLSearchParams({ page: String(page) });
  const response = await fetch(`${DISCOVER_API}?${search.toString()}`);
  const payload = (await response.json()) as
    | DiscoverContentResponse
    | { error: string };
  if (!response.ok || !("items" in payload)) {
    throw new Error(
      ("error" in payload && payload.error) ||
        "Explore providers could not be loaded.",
    );
  }
  return payload;
}

/** Same item id on consecutive pages is a duplicate; exact ids are not. */
export function dedupeById(items: MediaItem[]): MediaItem[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

/**
 * Discover More pagination: appends merged provider pages via the
 * infinite-query pattern shared with the Movies and Series features.
 */
export function useDiscoverBrowse() {
  return useInfiniteQuery({
    queryKey: ["explore", "combined", "discover"],
    queryFn: ({ pageParam }) => fetchDiscoverPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasNextPage ? allPages.length + 1 : undefined,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Page-1 overview query — feeds the featured card, trending/recommended
 * carousels, and the genre chips, untouched by discover pagination.
 */
export function useExploreOverview() {
  return useQuery({
    queryKey: ["explore", "overview"],
    queryFn: async () => {
      const response = await fetch("/api/explore");
      if (!response.ok) {
        throw new Error("Explore providers could not be loaded.");
      }
      return (await response.json()) as ExploreData;
    },
    staleTime: 5 * 60 * 1000,
  });
}
