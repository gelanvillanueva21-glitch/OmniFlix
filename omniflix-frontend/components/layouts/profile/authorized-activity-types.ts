/**
 * Server-safe shared definitions for the authorized activity ("See all")
 * page. Lives outside the "use client" component so server components can
 * import the helpers without crossing a client boundary.
 */

/** Media category segment accepted by profile/<type>?purpose_type=… */
export const AUTHORIZED_MEDIA_TYPES = [
  "comics",
  "novels",
  "movies",
  "series",
] as const;

export type AuthorizedMediaType = (typeof AUTHORIZED_MEDIA_TYPES)[number];

export function isAuthorizedMediaType(
  value: string,
): value is AuthorizedMediaType {
  return (AUTHORIZED_MEDIA_TYPES as readonly string[]).includes(value);
}

/** Maps a URL media type to the EntertainmentType the API stores. */
export function entertainmentTypeFromMediaType(
  mediaType: AuthorizedMediaType,
): "COMIC" | "NOVEL" | "MOVIE" | "SERIES" {
  switch (mediaType) {
    case "comics":
      return "COMIC";
    case "novels":
      return "NOVEL";
    case "movies":
      return "MOVIE";
    case "series":
      return "SERIES";
  }
}

const PURPOSE_LABELS: Record<
  "FAVORITE" | "WATCHLIST" | "READLIST" | "COMPLETED" | "ON_HOLD" | "DROPPED",
  string
> = {
  FAVORITE: "Favorites",
  WATCHLIST: "Watchlist",
  READLIST: "Readlist",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
  DROPPED: "Dropped",
};

export type PurposeLabel = keyof typeof PURPOSE_LABELS;

export function purposeLabel(purpose: PurposeLabel): string {
  return PURPOSE_LABELS[purpose];
}

const MEDIA_TYPE_LABELS: Record<AuthorizedMediaType, string> = {
  comics: "Comics",
  novels: "Novels",
  movies: "Movies",
  series: "Series",
};

export function mediaTypeLabel(mediaType: AuthorizedMediaType): string {
  return MEDIA_TYPE_LABELS[mediaType];
}

/**
 * Normalizes the purpose_type query parameter (human label OR raw enum) to
 * the canonical EntertainmentListType. Returns null when unrecognized.
 */
export function purposeTypeFromSearchParam(
  raw: string | undefined,
): PurposeLabel | null {
  if (!raw) return null;
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    // Malformed escape — fall through with the raw string.
  }
  value = value.trim().toUpperCase().replace(/\s+/g, "_");
  switch (value) {
    case "FAVORITES":
    case "FAVORITE":
      return "FAVORITE";
    case "WATCHLIST":
      return "WATCHLIST";
    case "READLIST":
    case "READLISTS":
      return "READLIST";
    case "COMPLETED":
      return "COMPLETED";
    case "ON_HOLD":
    case "ONHOLD":
      return "ON_HOLD";
    case "DROPPED":
      return "DROPPED";
    default:
      return null;
  }
}
