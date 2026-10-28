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
