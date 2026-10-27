"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { MediaItem } from "@/lib/media";

const POPULAR_MOVIES_API = "/api/tmdb/popular-movies";
const TMDB_MOVIE_SEARCH_API = "/api/tmdb/search-movies";
export const POPULAR_MOVIES_LIMIT = 12;

interface PopularMoviesResponse {
  items: MediaItem[];
  hasNextPage: boolean;
}

async function fetchPopularMoviesPage(
  page: number,
): Promise<PopularMoviesResponse> {
  const search = new URLSearchParams({
    limit: String(POPULAR_MOVIES_LIMIT),
    page: String(page),
  });
  const response = await fetch(`${POPULAR_MOVIES_API}?${search.toString()}`);
  const payload = (await response.json()) as
    | PopularMoviesResponse
    | { error: string };
  if (!response.ok || !("items" in payload)) {
    throw new Error(
      ("error" in payload && payload.error) || "TMDB is unavailable right now.",
    );
  }
  return payload;
}

/** Same movie id on consecutive pages is a duplicate; exact ids are not. */
export function dedupeById(items: MediaItem[]): MediaItem[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

async function searchTMDBMovies(query: string): Promise<MediaItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const search = new URLSearchParams({ query: trimmed });
  const response = await fetch(`${TMDB_MOVIE_SEARCH_API}?${search.toString()}`);
  const payload = (await response.json()) as
    | { items: MediaItem[] }
    | { error: string };
  if (!response.ok || !("items" in payload)) {
    throw new Error(
      ("error" in payload && payload.error) || "TMDB search is unavailable.",
    );
  }
  return payload.items;
}

/**
 * Debounced-query movie search for the Movies Explore section — the exact
 * Series search pattern (per-query cache entry, no stale-result flashes).
 */
export function useMovieSearch(query: string) {
  return useQuery({
    queryKey: ["movies", "search", query],
    queryFn: () => searchTMDBMovies(query),
    enabled: query.trim().length > 0,
    staleTime: 60 * 1000,
  });
}

/**
 * Browse-content pagination: appends TMDB pages via the infinite-query
 * pattern shared with the Novels feature.
 */
export function usePopularMoviesBrowse() {
  return useInfiniteQuery({
    queryKey: ["movies", "popular", "browse"],
    queryFn: ({ pageParam }) => fetchPopularMoviesPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasNextPage ? allPages.length + 1 : undefined,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Sidebar popular content keeps its own page-1 query — the exact Comics
 * pattern — so browse pagination can never overwrite it.
 */
export function usePopularMovies() {
  return useQuery({
    queryKey: ["movies", "popular", "sidebar"],
    queryFn: () => fetchPopularMoviesPage(1),
    staleTime: 5 * 60 * 1000,
  });
}
