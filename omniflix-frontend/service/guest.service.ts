import type { EntertainmentType } from "./types/profile.payload";
import type { MediaItem } from "@/lib/media";

/**
 * Guest (unauthenticated) activity tracking.
 *
 * When the visitor has no session, their history activity cannot be written
 * to the database. Instead, the minimal identity tuple needed to re-fetch the
 * metadata later — (externalId, apiSource) — is persisted in the browser's
 * localStorage as a JSON array. The same storage is read back on every visit
 * while the user stays unauthenticated, so the history view can resolve each
 * entry through the existing provider services.
 */

const GUEST_ACTIVITY_STORAGE_KEY = "omniflix:guest-activity";

/** Minimal identity of one history entry, exactly what the API writes server-side. */
export interface GuestActivityPayload {
  externalId: string;
  apiSource: string;
  /** Which media kind this id belongs to — decided by the caller at save time
   *  so the read side never has to guess which provider endpoint to hit. */
  entertainmentType: EntertainmentType;
}

/** A stored guest entry, enriched with client-side bookkeeping fields. */
export interface GuestActivityEntry extends GuestActivityPayload {
  /** Client-generated unique id (matches the `externalId` it describes). */
  id: string;
  /** When the entry was first recorded (ISO-8601). */
  createdAt: string;
}

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

/** Parses and validates the raw JSON stored under the storage key. */
function parseStoredEntries(raw: string | null): GuestActivityEntry[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (entry): entry is GuestActivityEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as GuestActivityEntry).externalId === "string" &&
        typeof (entry as GuestActivityEntry).apiSource === "string" &&
        typeof (entry as GuestActivityEntry).entertainmentType === "string",
    );
  } catch {
    // Corrupted payload — reset rather than crash the history view.
    return [];
  }
}

/**
 * Records one guest history activity.
 *
 * Uses `externalId` as the duplicate key. Existing ids are left unchanged;
 * otherwise the new entry is prepended and persisted to localStorage.
 */
export function saveActivityGuestData(
  payload: GuestActivityPayload,
): GuestActivityEntry[] {
  if (!isBrowser()) return [];

  let externalId = payload.externalId;
  switch (payload.entertainmentType) {
    case "NOVEL":
      if (externalId.startsWith("lncrawl:")) {
        externalId = externalId.slice("lncrawl:".length);
      }
      break;
    case "MOVIE":
      if (externalId.startsWith("tmdb:movies:")) {
        externalId = externalId.slice("tmdb:movies:".length);
      } else if (externalId.startsWith("tmdb-")) {
        externalId = externalId.slice("tmdb-".length);
      }
      break;
    case "SERIES":
      if (externalId.startsWith("jikan:")) {
        externalId = externalId.slice("jikan:".length);
      } else if (externalId.startsWith("tmdb:series:")) {
        externalId = externalId.slice("tmdb:series:".length);
      }
      break;
  }

  if (!externalId || !payload.apiSource) {
    throw new Error("Guest activity requires both externalId and apiSource.");
  }

  if (!payload.entertainmentType) {
    throw new Error("Guest activity requires an entertainmentType.");
  }

  const entries = fetchActivityGuestData();

  const alreadyStored = entries.some(
    (entry) => entry.externalId === externalId,
  );
  if (alreadyStored) return entries;

  const newEntry: GuestActivityEntry = {
    id: externalId,
    externalId,
    apiSource: payload.apiSource,
    entertainmentType: payload.entertainmentType,
    createdAt: new Date().toISOString(),
  };

  const updated = [newEntry, ...entries].slice(0, 100); // cap history growth

  try {
    window.localStorage.setItem(
      GUEST_ACTIVITY_STORAGE_KEY,
      JSON.stringify(updated),
    );
  } catch (error) {
    // Storage full / disabled — activity tracking is best-effort for guests.
    console.error("Guest activity could not be persisted", error);
  }

  return updated;
}

/**
 * Reads the guest activity JSON from localStorage and returns the parsed
 * entries (newest first). Returns an empty array when nothing is stored,
 * storage is unavailable, or the payload is corrupted.
 */
export function fetchActivityGuestData(): GuestActivityEntry[] {
  if (!isBrowser()) return [];

  return parseStoredEntries(
    window.localStorage.getItem(GUEST_ACTIVITY_STORAGE_KEY),
  );
}

/** Optional helper: removes one entry by identity tuple. */
export function removeActivityGuestData(
  payload: GuestActivityPayload,
): GuestActivityEntry[] {
  if (!isBrowser()) return [];

  const identity = (entry: GuestActivityPayload) =>
    `${entry.apiSource}|${entry.externalId}`;

  const updated = fetchActivityGuestData().filter(
    (entry) => identity(entry) !== identity(payload),
  );

  try {
    window.localStorage.setItem(
      GUEST_ACTIVITY_STORAGE_KEY,
      JSON.stringify(updated),
    );
  } catch (error) {
    console.error("Guest activity could not be persisted", error);
  }

  return updated;
}

/** Optional helper: clears all guest activity (e.g. after sign-in merge). */
export function clearActivityGuestData(): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(GUEST_ACTIVITY_STORAGE_KEY);
  } catch (error) {
    console.error("Guest activity could not be cleared", error);
  }
}

/**
 * Resolves every stored guest history entry into a fully-populated MediaItem
 * by reusing the same provider fetchers the authenticated profile uses.
 *
 * Because each entry was persisted with its `entertainmentType` at save time,
 * the provider endpoint to call is unambiguous: the tuple
 * (externalId, apiSource, entertainmentType) is shaped into the same record
 * format `fetchEntertainmentMetadata()` already consumes, so the guest read
 * path and the server-backed read path share one implementation.
 *
 * Individual entries are fetched with `Promise.allSettled`: a single dead id
 * (deleted comic, stale provider id) is dropped instead of failing the whole
 * history. Results are returned newest-first, matching storage order.
 */
export async function fetchGuestActivityMediaItems(): Promise<MediaItem[]> {
  const entries = fetchActivityGuestData();
  if (entries.length === 0) return [];

  const { fetchEntertainmentMetadata } = await import(
    "./entertainment-metadata.service"
  );

  const settled = await Promise.allSettled(
    entries.map(async (entry) => {
      const record = {
        id: 0,
        profileId: 0,
        externalId: entry.externalId,
        apiSource: entry.apiSource,
        purpose: "FAVORITE" as const,
        entertainmentType: entry.entertainmentType,
        createdAt: entry.createdAt,
      };
      const media = await fetchEntertainmentMetadata(record);
      return { media, createdAt: entry.createdAt };
    }),
  );

  const resolved: { media: MediaItem; createdAt: string }[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") {
      resolved.push(result.value);
    } else {
      // One dead entry must not blank the whole history — drop it quietly.
      console.error("Guest activity entry could not be loaded", result.reason);
    }
  }

  // allSettled resolves out of order; restore newest-first like the server API.
  resolved.sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );

  return resolved.map((item) => item.media);
}
