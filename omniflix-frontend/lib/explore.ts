import type { Genre, MediaItem } from "./media";
import {
    filterRestrictedMedia,
    isRestrictedMedia,
    normalizeGenreName,
    type RestrictedContentVisibility,
} from "./content-visibility";

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

/** Apply restricted-content rules before Explore data reaches card lists. */
export function applyContentVisibility(
    exploreData: ExploreData,
    visibility: RestrictedContentVisibility,
): ExploreData {
    if (visibility !== "hide") return exploreData;

    const discover = filterRestrictedMedia(exploreData.discover, visibility);
    const visibleGenreLabels = new Set(
        discover
            .flatMap((item) => item.genres ?? [])
            .map(normalizeGenreName),
    );

    return {
        ...exploreData,
        featured:
            exploreData.featured !== null &&
            !isRestrictedMedia(exploreData.featured)
                ? exploreData.featured
                : null,
        trending: filterRestrictedMedia(exploreData.trending, visibility),
        recommended: filterRestrictedMedia(exploreData.recommended, visibility),
        genres: exploreData.genres.filter((genre) =>
            visibleGenreLabels.has(normalizeGenreName(genre.label)),
        ),
        discover,
        popular: {
            comics: filterRestrictedMedia(exploreData.popular.comics, visibility),
            novels: filterRestrictedMedia(exploreData.popular.novels, visibility),
            movies: filterRestrictedMedia(exploreData.popular.movies, visibility),
            series: filterRestrictedMedia(exploreData.popular.series, visibility),
        },
    };
}
