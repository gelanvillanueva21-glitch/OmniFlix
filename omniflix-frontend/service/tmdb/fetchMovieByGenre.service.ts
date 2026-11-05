/**
 * TMDB genre service: one page of movies for a TMDB genre ID, mapped to the
 * shared MediaItem format for the Movies "You Might Also Like" carousel.
 *
 * Endpoint —
 * GET {NEXT_PUBLIC_TMDB_API_URL}/discover/movie?with_genres={genreId}&page={page}&sort_by=popularity.desc
 * The genre ID must be a TMDB movie genre ID (`id` from the TMDB genre list);
 * Jikan `malId` values are never valid here and vice versa.
 */
import "server-only";

import type { MediaItem } from "@/lib/media";
import {
  configuredEnvironmentValue,
  providerRequest,
} from "../provider-client.service";
import type { TmdbResult } from "../types/TmdbFetchPayload";

export interface TmdbMovieByGenrePage {
  items: MediaItem[];
  /** True while TMDB still reports pages past the current one. */
  hasNextPage: boolean;
}

interface TmdbDiscoverMovieResponse {
  results?: TmdbResult[];
  page?: number;
  total_pages?: number;
}

/**
 * One popularity-ranked page of movies for the given TMDB genre ID.
 * Returns items shaped exactly like the `MediaItem` entries `MediaCarousel`
 * already renders. Reuses the existing bearer-token / api-key fallback chain.
 */
export async function fetchMovieByGenre(
  genreId: string,
  page = 1,
): Promise<TmdbMovieByGenrePage> {
  const safePage = Math.max(page, 1);
  const baseUrl =
    configuredEnvironmentValue("NEXT_PUBLIC_TMDB_API_URL") ||
    process.env.NEXT_PUBLIC_TMDB_API_URL ||
    "https://api.themoviedb.org/3";
  const { headers, apiKey } = resolveTmdbAuth();

  const searchParams = new URLSearchParams({
    with_genres: genreId,
    page: String(safePage),
    sort_by: "popularity.desc",
  });
  if (!headers && apiKey) {
    searchParams.set("api_key", apiKey);
  }

  const response = await providerRequest<TmdbDiscoverMovieResponse>(
    `${baseUrl.replace(/\/$/, "")}/discover/movie?${searchParams}`,
    { headers },
  );

  const totalPages = response.total_pages ?? 1;
  return {
    items: (response.results ?? []).flatMap(mapResultToMediaItem),
    hasNextPage: safePage < totalPages,
  };
}

/**
 * Same normalization as the existing TMDB browse pages: provider-aware
 * `tmdb:movies:{id}` id, name fallback, w500 poster URL, vote average, and the
 * release year. Entries missing an ID or title are dropped.
 */
function mapResultToMediaItem(result: TmdbResult): MediaItem[] {
  const title = result.title ?? result.name;
  if (!title || typeof result.id !== "number") {
    return [];
  }

  return [
    {
      id: `tmdb:movies:${result.id}`,
      title,
      type: "movies",
      coverImage: result.poster_path
        ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
        : undefined,
      description: result.overview,
      rating:
        result.vote_average && result.vote_average > 0
          ? result.vote_average
          : undefined,
      releaseYear: getYear(result.release_date ?? result.first_air_date),
    },
  ];
}

interface TmdbAuth {
  headers: Record<string, string> | undefined;
  apiKey: string | undefined;
}

/**
 * Reuses the existing TMDB authentication chain: a JWT-shaped read-access
 * token becomes a Bearer header, otherwise an api key is appended to the
 * query string by the caller.
 */
function resolveTmdbAuth(): TmdbAuth {
  const token =
    configuredEnvironmentValue(
      "TMDB_READ_ACCESS_TOKEN",
      "NEXT_PUBLIC_TOKEN_TMBD",
    ) || process.env.NEXT_PUBLIC_TOKEN_TMBD;
  const apiKey =
    configuredEnvironmentValue(
      "TMDB_API_KEY",
      "NEXT_PUBLIC_API_KEY",
      "NEXT_PUBLIC_TMDB_API_KEY",
    ) ||
    process.env.NEXT_PUBLIC_TMDB_API_KEY ||
    process.env.NEXT_PUBLIC_API_KEY;
  const headers =
    token?.split(".").length === 3
      ? { Authorization: `Bearer ${token}` }
      : undefined;

  if (!headers && !apiKey) {
    throw new Error("TMDB credentials are not configured.");
  }

  return { headers, apiKey };
}

function getYear(date: string | undefined): number | undefined {
  const year = Number(date?.slice(0, 4));
  return Number.isInteger(year) ? year : undefined;
}
