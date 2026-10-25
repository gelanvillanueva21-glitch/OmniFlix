"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { MediaItem, SeriesSearchResult } from "@/lib/media";

export type { SeriesSearchResult };

const TMDB_SERIES_API = "/api/tmdb/popular-tv";
const JIKAN_ANIME_API = "/api/jikan/popular-anime";
const TMDB_SEARCH_API = "/api/tmdb/search-tv";
const JIKAN_SEARCH_API = "/api/jikan/search-anime";
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
export function shuffleItems<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function searchTMDB(query: string): Promise<SeriesSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const search = new URLSearchParams({ query: trimmed });
  const response = await fetch(`${TMDB_SEARCH_API}?${search.toString()}`);
  const payload = (await response.json()) as
    | { items: SeriesSearchResult[] }
    | { error: string };
  if (!response.ok || !("items" in payload)) {
    throw new Error(
      ("error" in payload && payload.error) || "TMDB search is unavailable.",
    );
  }
  return payload.items;
}

export async function searchJikan(query: string): Promise<SeriesSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const search = new URLSearchParams({ query: trimmed });
  const response = await fetch(`${JIKAN_SEARCH_API}?${search.toString()}`);
  const payload = (await response.json()) as
    | { items: SeriesSearchResult[] }
    | { error: string };
  if (!response.ok || !("items" in payload)) {
    throw new Error(
      ("error" in payload && payload.error) || "Jikan search is unavailable.",
    );
  }
  return payload.items;
}

export async function searchDualSeries(
  query: string,
): Promise<{ results: SeriesSearchResult[]; error?: string }> {
  const trimmed = query.trim();
  if (!trimmed) return { results: [] };

  const [seriesRes, animeRes] = await Promise.allSettled([
    searchTMDB(trimmed),
    searchJikan(trimmed),
  ]);

  const results: SeriesSearchResult[] = [];
  const errors: string[] = [];

  if (seriesRes.status === "fulfilled") {
    results.push(...seriesRes.value);
  } else {
    errors.push(
      seriesRes.reason instanceof Error
        ? seriesRes.reason.message
        : "TMDB search failed.",
    );
  }

  if (animeRes.status === "fulfilled") {
    results.push(...animeRes.value);
  } else {
    errors.push(
      animeRes.reason instanceof Error
        ? animeRes.reason.message
        : "Jikan search failed.",
    );
  }

  if (errors.length === 2 && results.length === 0) {
    throw new Error("Both TMDB and Jikan search failed. Please try again.");
  }

  return {
    results: shuffleItems(results),
    error: errors.length === 1 ? errors[0] : undefined,
  };
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
