/**
 * Jikan fetch service: anime details plus the complete episode list, keyed by
 * the MyAnimeList ID carried in the existing card ids (`jikan:{malId}` from
 * the browse service, `jikan-{malId}` from search).
 *
 * Uses the custom proxy configured through `NEXT_PUBLIC_JIKAN_API_URL` — the
 * same base URL as `jikan.service.ts` — which serves camelCase fields with
 * pagination under `meta.pagination` (episode pages hold up to 100 items).
 */
import "server-only";

import {
  providerRequest,
} from "../provider-client.service";
import type {
  JikanAnimeDetailResponse,
  JikanAnimeFetchPayload,
  JikanEpisode,
  JikanEpisodeDetailResponse,
  JikanEpisodeListItem,
  JikanEpisodesResponse,
} from "../types/JikanFetchPayload";
import { resolveBaseUrl } from "@/lib/baseUrl";

export type { JikanAnimeFetchPayload } from "../types/JikanFetchPayload";

/** Proxy caps list pages; hard-stop pagination so a misbehaving proxy cannot loop forever. */
const EPISODES_MAX_PAGE = 100;

/**
 * Anime details plus every available episode — GET /anime/{id} and
 * GET /anime/{id}/episodes?page={p} walked until the proxy stops reporting
 * `meta.pagination.hasNextPage`. Individual episode detail
 * (GET /anime/{id}/episodes/{episode}) is intentionally not requested per
 * episode: the list response already carries titles and air dates, so the
 * detail endpoint is only exposed for one-off lookups via `fetchAnimeEpisode`.
 */
export async function fetchAnimeDataPayload(
  animeId: string | number,
): Promise<JikanAnimeFetchPayload> {
  const detail = await fetchAnimeDetail(animeId);

  const malId = detail.malId;
  if (!malId) {
    throw new Error(`Jikan returned no anime id for input ${animeId}.`);
  }

  const { episodes, episodesTruncated } = await fetchAnimeEpisodes(malId);

  return {
    anime: detail,
    episodes,
    episodesTruncated,
    status: detail.status ?? undefined,
  };
}

/**
 * Anime details — GET /anime/{id}. Empty `data` or a missing ID means the
 * anime does not exist on the provider.
 */
export async function fetchAnimeDetail(
  animeId: string | number,
): Promise<import("../types/JikanFetchPayload").JikanAnimeDetail> {
  const baseUrl = resolveBaseUrl();
  const response = await providerRequest<JikanAnimeDetailResponse>(
    `${baseUrl}/anime/${encodeURIComponent(String(animeId))}`,
  );

  const anime = response.data;
  if (!anime || (!anime.malId && !anime.title)) {
    throw new Error(`Anime not found for id ${animeId}.`);
  }
  return anime;
}

/**
 * One page of the episode list — GET /anime/{id}/episodes?page={page}. Exposed
 * for callers that paginate on demand instead of walking every page.
 */
export async function fetchAnimeEpisodePage(
  animeId: string | number,
  page: number,
): Promise<{ episodes: JikanEpisode[]; hasNextPage: boolean }> {
  const baseUrl = resolveBaseUrl();
  const safePage = Math.max(page, 1);
  const response = await providerRequest<JikanEpisodesResponse>(
    `${baseUrl}/anime/${encodeURIComponent(String(animeId))}/episodes?page=${safePage}`,
  );

  const pagination = response.meta?.pagination;
  return {
    episodes: mapEpisodeListItems(response.data ?? []),
    hasNextPage: pagination?.hasNextPage === true,
  };
}

/**
 * Full episode list for an anime — walks GET /anime/{id}/episodes?page={p}
 * while the proxy reports `meta.pagination.hasNextPage` (up to
 * `EPISODES_MAX_PAGE` pages of 100 entries). Returns ascending by episode
 * number and a `truncated` flag when the hard page cap cut the walk short.
 */
export async function fetchAnimeEpisodes(
  animeId: string | number,
): Promise<{ episodes: JikanEpisode[]; episodesTruncated: boolean }> {
  const baseUrl = resolveBaseUrl();
  const encodedId = encodeURIComponent(String(animeId));

  const collected: JikanEpisode[] = [];
  let page = 1;
  let truncated = false;

  while (page <= EPISODES_MAX_PAGE) {
    const response = await providerRequest<JikanEpisodesResponse>(
      `${baseUrl}/anime/${encodedId}/episodes?page=${page}`,
    );

    const pageEpisodes = mapEpisodeListItems(response.data ?? []);
    if (pageEpisodes.length > 0) {
      collected.push(...pageEpisodes);
    }

    if (response.meta?.pagination?.hasNextPage !== true) {
      break;
    }
    page += 1;
  }

  truncated = page > EPISODES_MAX_PAGE;

  return {
    episodes: sortEpisodes(collected),
    episodesTruncated: truncated,
  };
}

/**
 * One episode's extended details — GET /anime/{id}/episodes/{episode}.
 * Only needed when a synopsis or duration is required beyond the list entry.
 */
export async function fetchAnimeEpisode(
  animeId: string | number,
  episodeNumber: number,
): Promise<import("../types/JikanFetchPayload").JikanEpisodeDetail> {
  const baseUrl = resolveBaseUrl();
  const response = await providerRequest<JikanEpisodeDetailResponse>(
    `${baseUrl}/anime/${encodeURIComponent(String(animeId))}/episodes/${encodeURIComponent(String(episodeNumber))}`,
  );

  const episode = response.data;
  if (!episode || episode.episode === undefined) {
    throw new Error(`Episode ${episodeNumber} not found for anime ${animeId}.`);
  }
  return episode;
}

function mapEpisodeListItems(items: JikanEpisodeListItem[]): JikanEpisode[] {
  return items.flatMap((item) => {
    if (typeof item.number !== "number") {
      return [];
    }
    return [
      {
        number: item.number,
        title: item.title ?? undefined,
        titleJapanese: item.titleJapanese ?? undefined,
        aired: item.aired ?? undefined,
        score: typeof item.score === "number" ? item.score : undefined,
        url: item.url ?? undefined,
        filler: item.filler === true,
        recap: item.recap === true,
      },
    ];
  });
}

function sortEpisodes(episodes: JikanEpisode[]): JikanEpisode[] {
  return [...episodes].sort((first, second) => first.number - second.number);
}


