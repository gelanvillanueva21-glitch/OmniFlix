/**
 * Saving content to the authenticated profile's lists.
 *
 * Every function here funnels through `saveEntertainment()` in
 * `profile.service.ts`, which POSTs to the Next.js `/api/entertainment`
 * route. The four public save functions exist so callers never spell out the
 * `purpose` themselves — each one hardcodes exactly one of the four supported
 * list types (FAVORITE, WATCHLIST, READLIST, COMPLETED).
 */

import type {
  EntertainmentListType,
  EntertainmentType,
  UserEntertainmentItem,
} from "./types/profile.payload";
import type { JikanAnimeFetchPayload } from "./types/JikanFetchPayload";
import type {
  TmdbMovieFetchPayload,
  TmdbSeriesFetchPayload,
} from "./types/TmdbFetchPayload";
import {
    NextApiRequest,
    type ApiResponse,
} from "./client.service";
import { saveEntertainment } from "./profile.service";

/** Identity + kind of the content being saved, derived by the caller. */
export interface SaveContentArgs {
  /** The provider id of the content (e.g. TMDB movie id, MAL id, comic id). */
  readonly externalId: string;
  /** Which provider served the content: "suwayomi", "jikan", "lncrawl", "tmdb". */
  readonly apiSource: string;
  readonly entertainmentType: EntertainmentType;
}

/**
 * Duplicate guard shared by every save function. GETs the profile's stored
 * items for the given list purpose (the GET handler filters by purpose +
 * authenticated profile) and returns `false` when the externalId is already
 * among them, `true` when the item is safe to save.
 */
export async function checkData(
  entertainmentType: EntertainmentType,
  externalId: string,
  purpose: EntertainmentListType,
): Promise<boolean> {
  const response = await NextApiRequest<ApiResponse<UserEntertainmentItem[]>>(
        `entertainment?purpose=${encodeURIComponent(purpose)}`,
  );
  const items = response.data ?? [];
  return !items.some((item) => item.externalId === externalId);
}

/** Result of a save attempt: the created row, or nothing when skipped. */
export type SaveContentResult = UserEntertainmentItem | undefined;

/** Shared guard-and-write body behind the four save functions. */
async function saveIfNew(
  args: SaveContentArgs,
  purpose: EntertainmentListType,
): Promise<SaveContentResult> {
  const isNew = await checkData(
        args.entertainmentType,
        args.externalId,
        purpose,
  );
  // Already stored in this list — do nothing, signal via undefined.
  if (!isNew) {
        return undefined;
  }
  return saveEntertainment({ ...args, purpose });
}

/** Adds the content to the profile's FAVORITE list. */
export function saveFavorite(
  args: SaveContentArgs,
): Promise<SaveContentResult> {
  return saveIfNew(args, "FAVORITE");
}

/** Adds the content to the profile's WATCHLIST list (watch content). */
export function saveWatchList(
  args: SaveContentArgs,
): Promise<SaveContentResult> {
  return saveIfNew(args, "WATCHLIST");
}

/** Adds the content to the profile's READLIST list (read content). */
export function saveReadList(
  args: SaveContentArgs,
): Promise<SaveContentResult> {
  return saveIfNew(args, "READLIST");
}

/** Adds the content to the profile's COMPLETED list. */
export function saveCompleted(
  args: SaveContentArgs,
): Promise<SaveContentResult> {
  return saveIfNew(args, "COMPLETED");
}

// ---------------------------------------------------------------------------
// Payload → SaveContentArgs resolvers
// ---------------------------------------------------------------------------

/** TMDB movie: the normalized payload keeps the numeric TMDB id. */
export function saveArgsFromTmdbMovie(
  payload: TmdbMovieFetchPayload,
): SaveContentArgs {
  return {
    externalId: String(payload.id),
    apiSource: "tmdb",
    entertainmentType: "MOVIE",
  };
}

/** TMDB series: the id lives on the embedded series detail. */
export function saveArgsFromTmdbSeries(
  payload: TmdbSeriesFetchPayload,
): SaveContentArgs {
  if (payload.series.id === undefined) {
    throw new Error("TMDB series payload is missing its series id.");
  }
  return {
    externalId: String(payload.series.id),
    apiSource: "tmdb",
    entertainmentType: "SERIES",
  };
}

/** Jikan anime: MyAnimeList carries its own id space. */
export function saveArgsFromJikanAnime(
  payload: JikanAnimeFetchPayload,
): SaveContentArgs {
  if (payload.anime.malId === undefined) {
    throw new Error("Jikan anime payload is missing its MAL id.");
  }
  return {
    externalId: String(payload.anime.malId),
    apiSource: "jikan",
    entertainmentType: "SERIES",
  };
}
