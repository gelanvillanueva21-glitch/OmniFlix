import type { Genre, MediaItem } from "./media";

export type GenreProvider = "tmdb" | "jikan" | "lncrawl" | "suwayomi";

export type GenreMediaType =
    | "movies"
    | "series"
    | "anime"
    | "manga"
    | "novels"
    | "comics";

export type GenreTaxonomy = "genres" | "tags" | "source-filters";

export interface GenreOptionsResponse {
    genres: Genre[];
    supported: boolean;
    taxonomy: GenreTaxonomy;
}

export interface GenreContentResponse {
    items: MediaItem[];
    page: number;
    hasNextPage: boolean;
    supported: boolean;
    taxonomy: GenreTaxonomy;
}

export function isGenreProvider(value: string | null): value is GenreProvider {
    return (
        value === "tmdb" ||
        value === "jikan" ||
        value === "lncrawl" ||
        value === "suwayomi"
    );
}

export function isGenreMediaType(
    provider: GenreProvider,
    mediaType: string | null,
): mediaType is GenreMediaType {
    switch (provider) {
        case "tmdb":
            return mediaType === "movies" || mediaType === "series";
        case "jikan":
            return mediaType === "anime" || mediaType === "manga";
        case "lncrawl":
            return mediaType === "novels";
        case "suwayomi":
            return mediaType === "comics";
    }
}

export function genreTaxonomy(provider: GenreProvider): GenreTaxonomy {
    switch (provider) {
        case "lncrawl":
            return "tags";
        case "suwayomi":
            return "source-filters";
        default:
            return "genres";
    }
}
