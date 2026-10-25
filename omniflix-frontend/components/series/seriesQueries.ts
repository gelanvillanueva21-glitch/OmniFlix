"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { MediaItem } from "@/lib/media";

const TMDB_SERIES_API = "/api/tmdb/popular-tv";
const JIKAN_ANIME_API = "/api/jikan/popular-anime";
export const PAGE_LIMIT = 12;

interface PopularContentResponse {
  items: MediaItem[];
  hasNextPage: boolean;
}

async function fetchContentPage(
  api: string,
  fallbackError: string,
  page: number,
): Promise<PopularContentResponse> {
  const search = new URLSearchParams({
    limit: String(PAGE_LIMIT),
    page: String(page),
  });
  const response = await fetch(`${api}?${search.toString()}`);
  const payload = (await response.json()) as
    | PopularContentResponse
    | { error: string };
  if (!response.ok || !("items" in payload)) {
    throw new Error(("error" in payload && payload.error) || fallbackError);
  }
  return payload;
}

const fetchSeriesPage = (page: number) =>
  fetchContentPage(TMDB_SERIES_API, "TMDB is unavailable right now.", page);
const fetchAnimePage = (page: number) =>
  fetchContentPage(JIKAN_ANIME_API, "Jikan is unavailable right now.", page);

/** Same id on consecutive pages is a duplicate; exact ids are not. */
export function dedupeById(items: MediaItem[]): MediaItem[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

/**
 * One page of combined browse content: a TMDB series page and a Jikan anime
 * page are fetched concurrently and merged, shuffled so both providers mix
 * instead of appearing in separate blocks. Each provider keeps its own
 * request, mapping, and pagination — only the UI presentation is shared.
 */
interface CombinedBrowsePage {
  items: MediaItem[];
  /** Set when one of the two providers failed but the other succeeded. */
  providerError?: string;
  hasNextPage: boolean;
}

async function fetchCombinedBrowsePage(
  page: number,
): Promise<CombinedBrowsePage> {
  const [series, anime] = await Promise.allSettled([
    fetchSeriesPage(page),
    fetchAnimePage(page),
  ]);

  const items: MediaItem[] = [];
  const errors: string[] = [];
  if (series.status === "fulfilled") {
    items.push(...series.value.items);
  } else {
    errors.push(
      series.reason instanceof Error ? series.reason.message : "TMDB failed.",
    );
  }
  if (anime.status === "fulfilled") {
    items.push(...anime.value.items);
  } else {
    errors.push(
      anime.reason instanceof Error ? anime.reason.message : "Jikan failed.",
    );
  }

  if (errors.length === 2) {
    throw new Error("Both TMDB and Jikan are unavailable right now.");
  }

  const seriesSettled = series.status === "fulfilled";
  const animeSettled = anime.status === "fulfilled";

  return {
    items: shuffleItems(items),
    providerError: errors[0],
    hasNextPage:
      seriesSettled && animeSettled
        ? series.value.hasNextPage && anime.value.hasNextPage
        : seriesSettled
          ? series.value.hasNextPage
          : anime.status === "fulfilled" && anime.value.hasNextPage,
  };
}

/** Fisher–Yates shuffle so anime and series interleave on every page. */
function shuffleItems(items: MediaItem[]): MediaItem[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Combined browse pagination: appends merged TMDB + Jikan pages via the
 * infinite-query pattern shared with the Movies and Novels features.
 */
export function useSeriesBrowse() {
  return useInfiniteQuery({
    queryKey: ["series", "combined", "browse"],
    queryFn: ({ pageParam }) => fetchCombinedBrowsePage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasNextPage ? allPages.length + 1 : undefined,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Page-1 queries — the exact Movies pattern — feed the featured card and the
 * two Popular carousels, so browse pagination can never overwrite them.
 */
export function usePopularSeries() {
  return useQuery({
    queryKey: ["series", "tmdb", "sidebar"],
    queryFn: () => fetchSeriesPage(1),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePopularAnime() {
  return useQuery({
    queryKey: ["series", "jikan", "sidebar"],
    queryFn: () => fetchAnimePage(1),
    staleTime: 5 * 60 * 1000,
  });
}
