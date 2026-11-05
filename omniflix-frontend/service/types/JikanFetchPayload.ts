/**
 * Jikan fetch payload types, modeled on the verified custom proxy responses:
 *
 *   GET {NEXT_PUBLIC_JIKAN_API_URL}/anime/{id}                  → JikanAnimeDetailResponse
 *   GET {NEXT_PUBLIC_JIKAN_API_URL}/anime/{id}/episodes?page={p} → JikanEpisodesResponse
 *   GET {NEXT_PUBLIC_JIKAN_API_URL}/anime/{id}/episodes/{ep}     → JikanEpisodeDetailResponse
 *
 * The proxy serves camelCase fields (malId, imageUrl, startDate) with
 * pagination under `meta.pagination`. The interfaces moved here from
 * `jikan.service.ts` keep their original properties untouched so the existing
 * browse/search services continue to compile unchanged.
 */

import type { MediaItem } from "@/lib/media";



export interface JikanAnime {
  malId?: number;
  title?: string;
  imageUrl?: string;
  score?: number | null;
  startDate?: string | null;
}

export interface JikanSearchItem {
  malId?: number;
  mal_id?: number;
  title?: string;
  title_english?: string;
  synopsis?: string;
  imageUrl?: string;
  images?: {
    webp?: {
      large_image_url?: string;
      image_url?: string;
    };
    jpg?: {
      large_image_url?: string;
      image_url?: string;
    };
  };
  score?: number | null;
  year?: number;
  startDate?: string | null;
  aired?: {
    from?: string | null;
  };
  genres?: Array<{ name?: string } | string>;
  themes?: Array<{ name?: string } | string>;
  status?: string;
  type?: string;
  episodes?: number | null;
}

export interface JikanGenreEntry {
    malId?: number;
    mal_id?: number;
    name?: string;
    type?: string;
}

export interface JikanResponse {
  data?: JikanAnime[];
  meta?: { pagination?: { hasNextPage?: boolean } };
}

export interface JikanAnimePage {
  items: MediaItem[];
  hasNextPage: boolean;
}



/** Pagination block returned by the proxy under `meta.pagination`. */
export interface JikanPagination {
  page?: number;
  limit?: number;
  count?: number;
  total?: number | null;
  hasNextPage?: boolean;
}

/** Shared response envelope: `data` plus the proxy's cached `meta` block. */
export interface JikanEnvelope<T> {
  data?: T;
  meta?: {
    cached?: boolean;
    stale?: boolean;
    refreshFailed?: boolean;
    fetchedAt?: string;
    pagination?: JikanPagination;
  };
}

export type JikanGenreListResponse = JikanEnvelope<JikanGenreEntry[]>;

export type JikanGenreResultsResponse = JikanEnvelope<JikanSearchItem[]>;



/** Name/url pair used for genres, themes, producers, studios, licensors, demographics. */
export interface JikanNamedEntry {
  malId?: number;
  name?: string;
  url?: string;
}

/** Airing window as returned by the proxy (ISO dates plus a display string). */
export interface JikanAired {
  from?: string | null;
  to?: string | null;
  string?: string | null;
}

/** Weekly broadcast slot, only present for currently-airing TV anime. */
export interface JikanBroadcast {
  day?: string | null;
  time?: string | null;
  timezone?: string | null;
  string?: string | null;
}

/** YouTube trailer block. */
export interface JikanTrailer {
  youtubeId?: string | null;
  url?: string | null;
  embedUrl?: string | null;
}

/** Proxy image sizes for the anime poster. */
export interface JikanImages {
  small?: string | null;
  medium?: string | null;
  large?: string | null;
}

/**
 * Full anime details as returned by GET /anime/{id}. All fields optional so a
 * partial proxy response never breaks the consumer; `airing`/`aired` carry the
 * airing state used to decide whether an episode list can still grow.
 */
export interface JikanAnimeDetail {
  malId?: number;
  url?: string;
  title?: string;
  titleEnglish?: string;
  titleJapanese?: string;
  titleSynonyms?: string[];
  imageUrl?: string;
  images?: JikanImages;
  trailer?: JikanTrailer;
  synopsis?: string | null;
  background?: string | null;
  status?: string | null;
  /** Whether the anime is currently airing — do not assume it from the status text. */
  airing?: boolean;
  aired?: JikanAired;
  broadcast?: JikanBroadcast;
  /** Declared episode count; null/undefined for currently-airing shows. */
  episodes?: number | null;
  score?: number | null;
  scoredBy?: number | null;
  rank?: number | null;
  popularity?: number | null;
  favorites?: number | null;
  members?: number | null;
  rating?: string | null;
  duration?: string | null;
  type?: string | null;
  source?: string | null;
  season?: string | null;
  year?: number | null;
  genres?: JikanNamedEntry[];
  themes?: JikanNamedEntry[];
  demographics?: JikanNamedEntry[];
  producers?: JikanNamedEntry[];
  studios?: JikanNamedEntry[];
  licensors?: JikanNamedEntry[];
}

export type JikanAnimeDetailResponse = JikanEnvelope<JikanAnimeDetail>;

export interface JikanMangaDetail {
    malId?: number;
    title?: string;
    imageUrl?: string | null;
    images?: JikanImages;
    synopsis?: string | null;
    background?: string | null;
    status?: string | null;
    score?: number | null;
    chapters?: number | null;
    volumes?: number | null;
    published?: {
        from?: string | null;
    };
    genres?: JikanNamedEntry[];
}

export type JikanMangaDetailResponse = JikanEnvelope<JikanMangaDetail>;


/** One episode entry from the paginated episode list. */
export interface JikanEpisodeListItem {
  number?: number;
  title?: string | null;
  titleJapanese?: string | null;
  url?: string | null;
  /** Human-readable air date, e.g. "Oct 24, 1998". */
  aired?: string | null;
  score?: number | null;
  forumReplies?: number | null;
  filler?: boolean;
  recap?: boolean;
}

export type JikanEpisodesResponse = JikanEnvelope<JikanEpisodeListItem[]>;


/** Extended details for one episode, including a synopsis when the proxy has one. */
export interface JikanEpisodeDetail {
  malId?: number;
  episode?: number;
  title?: string | null;
  titleAlternative?: string | null;
  duration?: string | null;
  aired?: string | null;
  synopsis?: string | null;
  url?: string | null;
}

export type JikanEpisodeDetailResponse = JikanEnvelope<JikanEpisodeDetail>;



/** Normalized episode produced by the fetch service. */
export interface JikanEpisode {
  number: number;
  title?: string;
  titleJapanese?: string;
  aired?: string;
  score?: number;
  url?: string;
  filler?: boolean;
  recap?: boolean;
  /** Present only when individual episode details were requested. */
  synopsis?: string;
  duration?: string;
}

/** Combined anime + complete episode payload returned by the fetch service. */
export interface JikanAnimeFetchPayload {
  anime: JikanAnimeDetail;
  /** Every available episode across all episode-list pages, ascending. */
  episodes: JikanEpisode[];
  /** True when the proxy reports more episode pages than were fetched. */
  episodesTruncated: boolean;
  /** Provider status, e.g. "Currently Airing" / "Finished Airing". */
  status?: string;
}
