/**
 * TMDB fetch payload types, modeled on the TMDB v3 API:
 *
 *   GET {base}/tv/{series_id}                          → TmdbSeriesDetailResponse
 *   GET {base}/tv/{series_id}/season/{season_number}   → TmdbSeasonDetailResponse
 *   GET {base}/tv/{series_id}/season/{n}/episode/{e}   → TmdbEpisodeDetailResponse
 *
 * The `TmdbResult` interface moved here from `tmdb.service.ts` keeps its
 * original properties untouched so the existing browse/search services
 * continue to compile unchanged.
 */

// ---------------------------------------------------------------------------
// Interface moved verbatim from `service/tmdb.service.ts` (existing contract)
// ---------------------------------------------------------------------------

export interface TmdbResult {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
}

// ---------------------------------------------------------------------------
// Shared building blocks for the detail endpoints
// ---------------------------------------------------------------------------

/** Name/id pair used for genres, production companies, networks, and created-by. */
export interface TmdbNamedEntry {
  id?: number;
  name?: string;
}

/** Season entry embedded in the series detail's `seasons` array. */
export interface TmdbSeasonSummary {
  id?: number;
  name?: string;
  /** Season number; 0 is the specials season. */
  season_number?: number;
  episode_count?: number;
  air_date?: string | null;
  overview?: string | null;
  poster_path?: string | null;
  /** TMDB omits or nulls this for seasons that have not aired yet. */
  vote_average?: number | null;
}

/**
 * Full series details as returned by GET /tv/{series_id}. All fields optional
 * so a partial TMDB response never breaks the consumer.
 */
export interface TmdbSeriesDetail {
  id?: number;
  name?: string;
  original_name?: string;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number | null;
  vote_count?: number | null;
  popularity?: number | null;
  /** Provider status, e.g. "Returning Series" / "Ended" / "Canceled". */
  status?: string | null;
  /** e.g. "Scripted", "Animation", "Documentary". */
  type?: string | null;
  in_production?: boolean | null;
  first_air_date?: string | null;
  last_air_date?: string | null;
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
  genres?: TmdbNamedEntry[];
  created_by?: TmdbNamedEntry[];
  networks?: TmdbNamedEntry[];
  production_companies?: TmdbNamedEntry[];
  production_countries?: Array<{ iso_3166_1?: string; name?: string }>;
  spoken_languages?: Array<{ english_name?: string; name?: string }>;
  seasons?: TmdbSeasonSummary[];
  episode_run_time?: number[];
  homepage?: string | null;
  tagline?: string | null;
  languages?: string[];
  origin_country?: string[];
}

export type TmdbSeriesDetailResponse = TmdbSeriesDetail;

// ---------------------------------------------------------------------------
// Season details — GET /tv/{series_id}/season/{season_number}
// ---------------------------------------------------------------------------

/** One episode entry inside a season detail response. */
export interface TmdbEpisodeSummary {
  id?: number;
  name?: string | null;
  episode_number?: number | null;
  season_number?: number | null;
  overview?: string | null;
  air_date?: string | null;
  still_path?: string | null;
  runtime?: number | null;
  vote_average?: number | null;
  vote_count?: number | null;
  production_code?: string | null;
}

/**
 * Season detail response: season metadata plus its full episode list, so no
 * per-episode requests are needed for the episode listing.
 */
export interface TmdbSeasonDetail {
  id?: number;
  name?: string | null;
  overview?: string | null;
  season_number?: number | null;
  air_date?: string | null;
  poster_path?: string | null;
  episodes?: TmdbEpisodeSummary[];
}

export type TmdbSeasonDetailResponse = TmdbSeasonDetail;

// ---------------------------------------------------------------------------
// Single episode — GET /tv/{series_id}/season/{n}/episode/{e}
// ---------------------------------------------------------------------------

/** Extended details for one episode, including cast crew and guest stars. */
export interface TmdbEpisodeDetail extends TmdbEpisodeSummary {
  crew?: Array<{
    department?: string;
    job?: string;
    credit_id?: string;
    id?: number;
    name?: string;
  }>;
  guest_stars?: Array<{
    character?: string;
    credit_id?: string;
    id?: number;
    name?: string;
    order?: number;
  }>;
}

export type TmdbEpisodeDetailResponse = TmdbEpisodeDetail;

// ---------------------------------------------------------------------------
// Normalized fetch results returned by `tmdb.fetch.service.ts`
// ---------------------------------------------------------------------------

/** Normalized episode produced by the fetch service. */
export interface TmdbEpisode {
  seasonNumber: number;
  episodeNumber: number;
  title?: string;
  overview?: string;
  airDate?: string;
  runtimeMinutes?: number;
  rating?: number;
  stillImage?: string;
}

/** Normalized season grouping in the fetch payload. */
export interface TmdbSeason {
  seasonNumber: number;
  name?: string;
  overview?: string;
  airDate?: string;
  posterImage?: string;
  episodeCount: number;
  episodes: TmdbEpisode[];
}

/** Combined series + complete episode payload returned by the fetch service. */
export interface TmdbSeriesFetchPayload {
  series: TmdbSeriesDetail;
  /** Every season TMDB reports, specials (season 0) included, ascending. */
  seasons: TmdbSeason[];
  /** Every episode across all seasons, ordered by season then episode. */
  episodes: TmdbEpisode[];
  /** Seasons whose detail request failed are listed here by number. */
  failedSeasons: number[];
  /** Provider status, e.g. "Returning Series" / "Ended". */
  status?: string;
}
// ---------------------------------------------------------------------------
// TMDB MOVIE DETAIL — GET /movie/{movie_id}
// ---------------------------------------------------------------------------

/**
 * Full movie details as returned by GET /movie/{movie_id}. All fields optional
 * so a partial TMDB response never breaks the consumer — the same tolerance
 * `TmdbSeriesDetail` applies.
 */
export interface TmdbMovieDetail {
  id?: number;
  title?: string | null;
  original_title?: string | null;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genres?: TmdbNamedEntry[];
  release_date?: string | null;
  runtime?: number | null;
  vote_average?: number | null;
  vote_count?: number | null;
  tagline?: string | null;
  /** Provider status, e.g. "Released" / "Rumored" / "Post Production". */
  status?: string | null;
  production_companies?: TmdbNamedEntry[];
  homepage?: string | null;
  imdb_id?: string | null;
  original_language?: string | null;
  budget?: number | null;
  revenue?: number | null;
}

export type TmdbMovieDetailResponse = TmdbMovieDetail;

/**
 * Normalized movie payload the UI consumes: `snake_case` provider fields are
 * mapped to camelCase, image paths are absolutized against the TMDB image
 * host, and only usable values (non-empty names, positive ratings) survive.
 */
export interface TmdbMovieFetchPayload {
  id: number;
  title?: string;
  originalTitle?: string;
  overview?: string;
  /** Absolute poster URL (`w500`), present only when TMDB supplied a path. */
  posterImage?: string;
  /** Absolute backdrop URL (`w1280`), present only when TMDB supplied a path. */
  backdropImage?: string;
  /** Genre display names only — ids are dropped here. */
  genres: string[];
  /** TMDB movie genre ids, used to request provider-valid recommendations. */
  genreIds: number[];
  releaseDate?: string;
  /** Year extracted from `release_date`, for compact "2024" rendering. */
  releaseYear?: number;
  runtimeMinutes?: number;
  /** `vote_average`, only when greater than zero. */
  rating?: number;
  voteCount?: number;
  tagline?: string;
  status?: string;
  /** Production company display names only — ids are dropped here. */
  productionCompanies: string[];
}
