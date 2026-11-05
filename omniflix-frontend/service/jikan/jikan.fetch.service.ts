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

import type { MediaItem } from "@/lib/media";
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
  JikanMangaDetailResponse,
} from "../types/JikanFetchPayload";
import { resolveProviderBaseUrl } from "@/lib/baseUrl";

export type { JikanAnimeFetchPayload } from "../types/JikanFetchPayload";

const JIKAN_BASE_URL = resolveProviderBaseUrl({
  envVar: "NEXT_PUBLIC_JIKAN_API_URL",
  stripJikanPath: true,
  serviceName: "Jikan",
});

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
  const response = await providerRequest<JikanAnimeDetailResponse>(
    `${JIKAN_BASE_URL}/anime/${encodeURIComponent(String(animeId))}`,
  );

  const anime = response.data;
  if (!anime || (!anime.malId && !anime.title)) {
    throw new Error(`Anime not found for id ${animeId}.`);
  }
  return anime;
}

export async function fetchJikanMangaDetail(
    mangaId: string | number,
): Promise<MediaItem> {
    const response = await providerRequest<JikanMangaDetailResponse>(
        `${JIKAN_BASE_URL}/manga/${encodeURIComponent(String(mangaId))}`,
    );
    const manga = response.data;
    const malId = manga?.malId;
    const title = manga?.title?.trim();

    if (!manga || typeof malId !== "number" || !title) {
        throw new Error(`Manga not found for id ${mangaId}.`);
    }

    const genres = (manga.genres ?? [])
        .map((genre) => genre.name)
        .filter((name): name is string => Boolean(name));
    const score =
        typeof manga.score === "number" && manga.score > 0
            ? Number(manga.score.toFixed(1))
            : undefined;
    const releaseYear = getYear(manga.published?.from);

    return {
        id: `jikan:manga:${malId}`,
        title,
        type: "comics",
        coverImage: manga.imageUrl ?? manga.images?.large ?? undefined,
        description: manga.synopsis?.trim() || undefined,
        genres: genres.length ? genres : undefined,
        rating: score,
        releaseYear,
        source: "Jikan Manga",
    };
}

/**
 * One page of the episode list — GET /anime/{id}/episodes?page={page}. Exposed
 * for callers that paginate on demand instead of walking every page.
 */
export async function fetchAnimeEpisodePage(
  animeId: string | number,
  page: number,
): Promise<{ episodes: JikanEpisode[]; hasNextPage: boolean }> {
  const safePage = Math.max(page, 1);
  const response = await providerRequest<JikanEpisodesResponse>(
    `${JIKAN_BASE_URL}/anime/${encodeURIComponent(String(animeId))}/episodes?page=${safePage}`,
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
  const encodedId = encodeURIComponent(String(animeId));

  const collected: JikanEpisode[] = [];
  let page = 1;
  let truncated = false;

  while (page <= EPISODES_MAX_PAGE) {
    const response = await providerRequest<JikanEpisodesResponse>(
      `${JIKAN_BASE_URL}/anime/${encodedId}/episodes?page=${page}`,
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
  const response = await providerRequest<JikanEpisodeDetailResponse>(
    `${JIKAN_BASE_URL}/anime/${encodeURIComponent(String(animeId))}/episodes/${encodeURIComponent(String(episodeNumber))}`,
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

function getYear(date: string | null | undefined): number | undefined {
    const match = /\d{4}/.exec(date ?? "");
    const year = match ? Number(match[0]) : NaN;
    return Number.isInteger(year) ? year : undefined;
}
