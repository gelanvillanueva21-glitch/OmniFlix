import type { Genre, MediaItem } from "./media";

export interface ExplorePopularMedia {
    comics: MediaItem[];
    novels: MediaItem[];
    movies: MediaItem[];
    series: MediaItem[];
}

export interface ExploreData {
    featured: MediaItem | null;
    trending: MediaItem[];
    recommended: MediaItem[];
    genres: Genre[];
    discover: MediaItem[];
    popular: ExplorePopularMedia;
    errors: Record<string, string | undefined>;
}
