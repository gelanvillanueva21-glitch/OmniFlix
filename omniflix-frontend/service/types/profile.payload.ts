// ── Profile payload types ──
// TODO: exact API contracts are not defined yet. Replace the TODO-marked
// placeholders with real response shapes when you implement the API yourself.
// Do not treat these as an existing API — the UI renders empty states until then.

/**
 * Mirrors the backend `EntertainmentType` enum (prisma/schema.prisma).
 * TODO: confirm casing matches your API's serialization (e.g. "COMIC" vs "comic").
 */
export type EntertainmentType =
    | "COMIC"
    | "MANGA"
    | "MANHWA"
    | "MANHUA"
    | "NOVEL"
    | "SERIES"
    | "MOVIE";

/**
 * Mirrors the backend `EntertainmentListType` enum (prisma/schema.prisma).
 * TODO: confirm casing matches your API's serialization.
 */
export type EntertainmentListType =
    | "FAVORITE"
    | "WATCHLIST"
    | "COMPLETED"
    | "ON_HOLD"
    | "PLAN_TO_WATCH"
    | "PLAN_TO_READ"
    | "DROPPED";

/** Profile data for the Profile page. TODO: confirm exact fields. */
export interface ProfileResponse {
    id: number;
    display_name: string | null;
    profile_picture_url: string | null;
    created_at: string;
    /** TODO: confirm whether the API returns this. */
    updated_at: string | null;
}

/** A single entertainment entry in a user collection. TODO: confirm shape. */
export interface UserEntertainmentItem {
  /** External provider id (e.g. AniList id). TODO: confirm. */
    external_id: string;
  /** Provider name (e.g. "anilist"). TODO: confirm. */
    api_source: string;
    entertainment_type: EntertainmentType;
    /** Which collection list this entry belongs to. TODO: confirm. */
    purpose: EntertainmentListType;
    created_at: string;
}

/** A user collection (e.g. Favorites) with its entries. TODO: confirm envelope. */
export interface UserEntertainmentList {
    purpose: EntertainmentListType;
    items: UserEntertainmentItem[];
}

/** TODO: history payload shape not defined yet — placeholder only. */
export interface UserHistoryItem {
  // TODO: define fields when the history API contract exists.
}
