/**
 * TMDB fetch service: complete TV series details plus every episode across
 * every season, keyed by the TMDB series ID carried in the existing card ids
 * (`tmdb:series:{id}` from the browse service, `tmdb-{id}` from search).
 *
 * Uses the existing TMDB base URL and server-side credential configuration —
 * the same bearer-token / api-key fallback chain as `tmdb.service.ts`.
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
  TmdbEpisode,
  TmdbEpisodeDetailResponse,
  TmdbEpisodeSummary,
  TmdbSeason,
  TmdbSeasonDetailResponse,
  TmdbSeriesDetailResponse,
  TmdbSeriesFetchPayload,
  TmdbEpisodeDetail,
  TmdbSeasonSummary
} from "../types/TmdbFetchPayload";

export type { TmdbSeriesFetchPayload } from "../types/TmdbFetchPayload";

const TMDB_BASE_URL = resolveProviderBaseUrl({
  envVar: "NEXT_PUBLIC_TMDB_API_URL",
  defaultUrl: "https://api.themoviedb.org/3",
  serviceName: "TMDB",
});

/**
 * Complete series payload — GET /tv/{series_id} for the series metadata, then
 * GET /tv/{series_id}/season/{n} for each season reported by the series
 * detail (specials included). Seasons are fetched sequentially so a failed
 * season degrades to a `failedSeasons` entry instead of failing the payload.
 */
export async function fetchSeriesDataPayload(
  seriesId: string | number,
): Promise<TmdbSeriesFetchPayload> {
  const series = await fetchSeriesDetail(seriesId);

  const numericId = series.id;
  if (!numericId) {
    throw new Error(`TMDB returned no series id for input ${seriesId}.`);
  }

  const seasons = await fetchAllSeasons(numericId, series.seasons ?? []);

  return {
    series,
    seasons: seasons.list,
    episodes: seasons.episodes,
    failedSeasons: seasons.failed,
    status: series.status ?? undefined,
  };
}

/**
 * Series details — GET /tv/{series_id}. Includes title, overview, poster,
 * backdrop, genres, status, ratings, first/last air dates, and the `seasons`
 * array that drives the per-season episode fetching.
 */
export async function fetchSeriesDetail(
  seriesId: string | number,
): Promise<import("../types/TmdbFetchPayload").TmdbSeriesDetail> {
  const { headers, apiKeyQuery } = resolveTmdbAuth();
  const response = await providerRequest<TmdbSeriesDetailResponse>(
    `${TMDB_BASE_URL}/tv/${encodeURIComponent(String(seriesId))}?language=en-US${apiKeyQuery}`,
    { headers },
  );

  if (!response.id) {
    throw new Error(`Series not found for id ${seriesId}.`);
  }
  return response;
}

/**
 * One season's details and full episode list —
 * GET /tv/{series_id}/season/{season_number}. TMDB returns every episode of
 * the season in this single response, so no per-episode listing requests are
 * needed. Specials use season number 0.
 */
export async function fetchSeasonDetail(
  seriesId: string | number,
  seasonNumber: number,
): Promise<import("../types/TmdbFetchPayload").TmdbSeasonDetail> {
  const { headers, apiKeyQuery } = resolveTmdbAuth();
  const response = await providerRequest<TmdbSeasonDetailResponse>(
    `${TMDB_BASE_URL}/tv/${encodeURIComponent(String(seriesId))}/season/${seasonNumber}?language=en-US${apiKeyQuery}`,
    { headers },
  );

  if (response.season_number === undefined && !response.episodes) {
    throw new Error(`Season ${seasonNumber} not found for series ${seriesId}.`);
  }
  return response;
}

/**
 * One episode's extended details —
 * GET /tv/{series_id}/season/{n}/episode/{e}. Only needed when guest stars or
 * crew are required beyond the season-list entry.
 */
export async function fetchEpisodeDetail(
  seriesId: string | number,
  seasonNumber: number,
  episodeNumber: number,
): Promise<TmdbEpisodeDetail> {
  const { headers, apiKeyQuery } = resolveTmdbAuth();
  const response = await providerRequest<TmdbEpisodeDetailResponse>(
    `${TMDB_BASE_URL}/tv/${encodeURIComponent(String(seriesId))}/season/${seasonNumber}/episode/${episodeNumber}?language=en-US${apiKeyQuery}`,
    { headers },
  );

  if (!response.id) {
    throw new Error(
      `Episode ${episodeNumber} of season ${seasonNumber} not found for series ${seriesId}.`,
    );
  }
  return response;
}

/**
 * Walks every season in the series detail's `seasons` array and collects all
 * episodes. Seasons with zero declared episodes are skipped without a
 * request; a season whose detail request fails is recorded in `failed` and
 * the walk continues, so one broken season cannot void the whole payload.
 */
async function fetchAllSeasons(
  seriesId: number,
  seasonSummaries: TmdbSeasonSummary[],
): Promise<{ list: TmdbSeason[]; episodes: TmdbEpisode[]; failed: number[] }> {
  const list: TmdbSeason[] = [];
  const episodes: TmdbEpisode[] = [];
  const failed: number[] = [];

  for (const summary of seasonSummaries) {
    const seasonNumber = summary.season_number;
    if (typeof seasonNumber !== "number") {
      continue;
    }

    // A season declaring zero episodes has nothing to fetch — the detail
    // request would return an empty `episodes` array anyway.
    if ((summary.episode_count ?? 0) === 0 && seasonNumber !== 0) {
      list.push({
        seasonNumber,
        name: summary.name ?? undefined,
        overview: summary.overview ?? undefined,
        airDate: summary.air_date ?? undefined,
        posterImage: tmdbImage(summary.poster_path),
        episodeCount: 0,
        episodes: [],
      });
      continue;
    }

    try {
      const season = await fetchSeasonDetail(seriesId, seasonNumber);
      const seasonEpisodes = mapSeasonEpisodes(
        season.episodes ?? [],
        seasonNumber,
      );

      list.push({
        seasonNumber,
        name: season.name ?? summary.name ?? undefined,
        overview: season.overview ?? undefined,
        airDate: season.air_date ?? undefined,
        posterImage: tmdbImage(season.poster_path ?? summary.poster_path),
        episodeCount: seasonEpisodes.length,
        episodes: seasonEpisodes,
      });
      episodes.push(...seasonEpisodes);
    } catch {
      failed.push(seasonNumber);
    }
  }

  list.sort((first, second) => first.seasonNumber - second.seasonNumber);
  episodes.sort(
    (first, second) =>
      first.seasonNumber - second.seasonNumber ||
      first.episodeNumber - second.episodeNumber,
  );

  return { list, episodes, failed };
}

function mapSeasonEpisodes(
  items: TmdbEpisodeSummary[],
  seasonNumber: number,
): TmdbEpisode[] {
  return items.flatMap((item) => {
    const episodeNumber = item.episode_number;
    if (typeof episodeNumber !== "number") {
      return [];
    }
    return [
      {
        seasonNumber,
        episodeNumber,
        title: item.name ?? undefined,
        overview: item.overview ?? undefined,
        airDate: item.air_date ?? undefined,
        runtimeMinutes: item.runtime ?? undefined,
        rating:
          typeof item.vote_average === "number" && item.vote_average > 0
            ? item.vote_average
            : undefined,
        stillImage: tmdbImage(item.still_path),
      },
    ];
  });
}

function tmdbImage(path: string | null | undefined): string | undefined {
  return path ? `https://image.tmdb.org/t/p/w500${path}` : undefined;
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

