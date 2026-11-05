/**
 * TMDB fetch service: single movie details, keyed by the TMDB movie ID
 * carried in the existing card ids (`tmdb:movies:{id}` from the browse
 * service, `tmdb-{id}` from search).
 *
 * Uses the existing TMDB base URL and server-side credential configuration —
 * the same bearer-token / api-key fallback chain as `tmdb.fetch.service.ts`.
 * Credentials never leave the server: consumers import this service from
 * server code (API routes / server components) only.
 */
import "server-only";

import {
  configuredEnvironmentValue,
  providerRequest,
} from "../provider-client.service";
import { resolveProviderBaseUrl } from "@/lib/baseUrl";

import type {
  TmdbMovieDetailResponse,
  TmdbMovieFetchPayload,
} from "../types/TmdbFetchPayload";

const TMDB_BASE_URL = resolveProviderBaseUrl({
  envVar: "NEXT_PUBLIC_TMDB_API_URL",
  defaultUrl: "https://api.themoviedb.org/3",
  serviceName: "TMDB",
});

/**
 * Movie details, normalized for the UI — GET /movie/{movie_id}. The raw
 * response is mapped into `TmdbMovieFetchPayload` so the client never has to
 * touch `snake_case` provider fields or relative image paths.
 */
export async function fetchMovieById(
  movieId: string | number,
): Promise<TmdbMovieFetchPayload> {
  if (typeof movieId !== "number" && String(movieId).trim() === "") {
    throw new Error("A TMDB movie id is required.");
  }

  const { headers, apiKeyQuery } = resolveTmdbAuth();
  const response = await providerRequest<TmdbMovieDetailResponse>(
    `${TMDB_BASE_URL}/movie/${encodeURIComponent(String(movieId))}?language=en-US${apiKeyQuery}`,
    { headers },
  );

  if (!response.id) {
    throw new Error(`Movie not found for id ${movieId}.`);
  }
  return mapMovieDetail(response);
}

/**
 * Maps the raw `GET /movie/{id}` response into the normalized payload:
 * absolutizes the poster/backdrop paths against the TMDB image host, keeps
 * only non-empty genre/company names, and derives the release year from the
 * release date so the UI gets display-ready values.
 */
function mapMovieDetail(movie: TmdbMovieDetailResponse): TmdbMovieFetchPayload {
  const id = movie.id as number;

  return {
    id,
    title: movie.title ?? undefined,
    originalTitle: movie.original_title ?? undefined,
    overview: movie.overview ?? undefined,
    posterImage: movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : undefined,
    backdropImage: movie.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
      : undefined,
    genres: (movie.genres ?? [])
      .map((genre) => genre.name)
      .filter((name): name is string => name !== undefined && name !== ""),
    genreIds: (movie.genres ?? [])
      .map((genre) => genre.id)
      .filter(
        (genreId): genreId is number =>
          typeof genreId === "number" &&
          Number.isSafeInteger(genreId) &&
          genreId > 0,
      ),
    releaseDate: movie.release_date ?? undefined,
    releaseYear: getYear(movie.release_date),
    runtimeMinutes:
      typeof movie.runtime === "number" && movie.runtime > 0
        ? movie.runtime
        : undefined,
    rating:
      typeof movie.vote_average === "number" && movie.vote_average > 0
        ? movie.vote_average
        : undefined,
    voteCount:
      typeof movie.vote_count === "number" && movie.vote_count > 0
        ? movie.vote_count
        : undefined,
    tagline: movie.tagline ?? undefined,
    status: movie.status ?? undefined,
    productionCompanies: (movie.production_companies ?? [])
      .map((company) => company.name)
      .filter((name): name is string => name !== undefined && name !== ""),
  };
}

/** Year portion of an ISO date string (`2024-07-12` → `2024`), when parseable. */
function getYear(date: string | null | undefined): number | undefined {
  if (!date) {
    return undefined;
  }
  const year = Number.parseInt(date.slice(0, 4), 10);
  return Number.isFinite(year) ? year : undefined;
}

interface TmdbAuth {
  headers: Record<string, string> | undefined;
  apiKeyQuery: string;
}

/**
 * Reuses the existing TMDB authentication chain from `tmdb.service.ts`:
 * a JWT-shaped read-access token becomes a Bearer header, otherwise an api
 * key is appended to the query string.
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

  if (!token && !apiKey) {
    throw new Error("TMDB credential is not configured.");
  }

  const headers =
    token?.split(".").length === 3
      ? { Authorization: `Bearer ${token}` }
      : undefined;
  const apiKeyQuery =
    apiKey && !headers ? `&api_key=${encodeURIComponent(apiKey)}` : "";

  return { headers, apiKeyQuery };
}
