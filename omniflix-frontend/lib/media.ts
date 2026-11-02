export type MediaType = "comics" | "novels" | "movies" | "series";

export type SeriesSearchSource = "tmdb" | "jikan" | "TMDB" | "Anime";

export interface SeriesSearchResult extends MediaItem {
  id: string;
  title: string;
  type: MediaType;
  description?: string;
  coverImage?: string;
  source?: string;
  rating?: number;
  year?: number;
  releaseYear?: number;
  genres?: string[];
  status?: string;
  episodes?: number;
}

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  /** Absolute URL or a path under /public. Rendered with graceful fallback when missing. */
  coverImage?: string;
  description?: string;
  genres?: string[];
  /** Only render when the data source is trusted. */
  rating?: number;
  releaseYear?: number;
  /** Provider or origin label, e.g. "TMDB" or "Anime". */
  source?: string;
}

export interface Genre {
  id: string;
  label: string;
}

const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  comics: "Comics",
  novels: "Novels",
  movies: "Movies",
  series: "Series",
};

/**
 * Internal detail-route destination for a media item, derived purely from the
 * existing `MediaItem.type` and `MediaItem.id`:
 *
 *   comics -> /comics/[sourceId]/[id]  (source-aware Suwayomi id)
 *   movies -> /movies/[id]
 *   series -> /series/[id]
 *   novels -> /novels/[id]
 *
 * Returns `null` for an unsupported type or a malformed id so callers can
 * render a non-navigable card instead of linking to an invalid URL.
 */
export function mediaHref(media: Pick<MediaItem, "id" | "type">): string | null {
    if (!media.id) return null;
    console.log(media.id);
    switch (media.type) {
        case "comics": {
            // Source-aware Suwayomi id: suwayomi:<sourceIdentifier>:<comicId>.
            // The source identifier stays a string — it is a LongString that can
            // exceed Number.MAX_SAFE_INTEGER, so it is never parsed as a number.
            const parts = media.id.split(":");
            if (
              parts.length !== 3 || 
              parts[0] !== "suwayomi"
            ) return null;

            const [, sourceId, comicId] = parts;
            if (!/^\d+$/.test(sourceId)) 
                return null;
            if (!/^\d+$/.test(comicId)) 
                return null;
            if (
              !Number.isSafeInteger(
                Number(comicId)
              ) || Number(
                comicId
              ) < 1) {
                return null;
            }
            return `/explore/comics/${sourceId}/${comicId}`;
        }
        case "movies":
            return `/explore/movies/${encodeURIComponent(media.id)}`;
        case "series":
            return `/explore/series/${encodeURIComponent(media.id)}`;
        case "novels":
            return `/explore/novels/${encodeURIComponent(media.id)}`;
        default:
            return null;
    }
}

export function mediaTypeLabel(type: MediaType): string {
  return MEDIA_TYPE_LABELS[type];
}

/**
 * Adapter boundary: when a real content API is integrated, its response is
 * mapped here into MediaItem so UI components never see provider-specific
 * field names. Example:
 *
 *   export function mapAniListEntry(entry: RawAniListEntry): MediaItem {
 *       return {
 *           id: `al-${entry.id}`,
 *           title: entry.title.english ?? entry.title.romaji,
 *           type: "comics",
 *           coverImage: entry.coverImage?.large,
 *           description: entry.description,
 *           genres: entry.genres,
 *           rating: entry.averageScore ? entry.averageScore / 10 : undefined,
 *       };
 *   }
 */
