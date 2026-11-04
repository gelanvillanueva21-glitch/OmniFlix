import type { Genre, MediaItem, SeriesSearchResult } from "@/lib/media";
import { configuredEnvironmentValue, providerRequest } from "../provider-client.service";
import type { TmdbResult } from "../types/TmdbFetchPayload";

export const TMDB_TV_GENRES: Record<number, string> = {
    10759: "Action & Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    10762: "Kids",
    9648: "Mystery",
    10763: "News",
    10764: "Reality",
    10765: "Sci-Fi & Fantasy",
    10766: "Soap",
    10767: "Talk",
    10768: "War & Politics",
    37: "Western",
};

export type TmdbTvSearchResult = SeriesSearchResult;

interface TmdbResponse {
    results?: TmdbResult[];
}

export interface TmdbMoviesPage {
    items: MediaItem[];
    totalPages: number;
}

interface TmdbGenreListResponse {
    genres?: Array<{ id?: number; name?: string }>;
}

/**
 * TMDB keeps movie and TV genres in separate lists. The selected list is also
 * used to validate IDs and map discover results back to genre names.
 */
export async function getTmdbGenres(
    mediaType: "movies" | "series",
): Promise<Genre[]> {
    const providerType = mediaType === "movies" ? "movie" : "tv";
    const baseUrl =
        configuredEnvironmentValue("NEXT_PUBLIC_TMDB_API_URL") ||
        process.env.NEXT_PUBLIC_TMDB_API_URL ||
        "https://api.themoviedb.org/3";
    const { headers, apiKey } = resolveTmdbGenreAuth();
    const searchParams = new URLSearchParams({ language: "en-US" });
    if (!headers && apiKey) {
        searchParams.set("api_key", apiKey);
    }

    const response = await providerRequest<TmdbGenreListResponse>(
        `${baseUrl.replace(/\/$/, "")}/genre/${providerType}/list?${searchParams}`,
        { headers },
    );

    return (response.genres ?? []).flatMap((genre) => {
        if (
            typeof genre.id !== "number" ||
            typeof genre.name !== "string" ||
            !genre.name.trim()
        ) {
            return [];
        }
        return [{ id: String(genre.id), label: genre.name }];
    });
}

/**
 * One page of TMDB discover results for an already validated provider genre.
 * Genre IDs are never shared between the movie and TV catalogs.
 */
export async function getTmdbGenrePage(
    mediaType: "movies" | "series",
    genreId: string,
    genres: Genre[],
    page: number,
): Promise<TmdbMoviesPage> {
    const providerType = mediaType === "movies" ? "movie" : "tv";
    const baseUrl =
        configuredEnvironmentValue("NEXT_PUBLIC_TMDB_API_URL") ||
        process.env.NEXT_PUBLIC_TMDB_API_URL ||
        "https://api.themoviedb.org/3";
    const { headers, apiKey } = resolveTmdbGenreAuth();
    const searchParams = new URLSearchParams({
        with_genres: genreId,
        language: "en-US",
        page: String(page),
    });
    if (!headers && apiKey) {
        searchParams.set("api_key", apiKey);
    }

    const response = await providerRequest<
        TmdbResponse & { total_pages?: number }
    >(
        `${baseUrl.replace(/\/$/, "")}/discover/${providerType}?${searchParams}`,
        { headers },
    );
    const genreNames = new Map(
        genres.map((genre) => [Number(genre.id), genre.label]),
    );

    return {
        items: mapResults(
            response.results,
            mediaType,
            Number.MAX_SAFE_INTEGER,
            genreNames,
        ),
        totalPages: response.total_pages ?? 1,
    };
}

/**
 * Popular movies for the Movies Explore section.
 *
 * Returns only the `/movie/popular` results mapped to MediaItem — no
 * trending, TV, or search data is mixed in. `page` follows TMDB's native
 * pagination so Browse content can append subsequent pages.
 */
export async function getPopularTmdbMovies(
    limit = 12,
    page = 1,
): Promise<TmdbMoviesPage> {
    return getPopularTmdbPage("movie", "movies", limit, page);
}

/**
 * Popular TV series for the Series Explore section. Same `/popular`
 * pagination contract as movies, against TMDB's `/tv/popular` endpoint.
 */
export async function getPopularTmdbTv(
    limit = 12,
    page = 1,
): Promise<TmdbMoviesPage> {
    return getPopularTmdbPage("tv", "series", limit, page);
}

/**
 * TV Search for the Series Explore section. Queries TMDB's `/search/tv` endpoint,
 * normalizes responses to the unified SeriesSearchResult format with source "tmdb",
 * maps genre IDs, and formats poster images.
 */
export async function searchTmdbTv(
    query: string,
    page = 1,
    limit = 20,
): Promise<{ items: TmdbTvSearchResult[]; totalPages: number }> {
    const trimmed = query.trim();
    if (!trimmed) {
        return { items: [], totalPages: 0 };
    }

    const baseUrl =
        configuredEnvironmentValue("NEXT_PUBLIC_TMDB_API_URL") ||
        process.env.NEXT_PUBLIC_TMDB_API_URL ||
        "https://api.themoviedb.org/3";
    const token =
        configuredEnvironmentValue("TMDB_READ_ACCESS_TOKEN", "NEXT_PUBLIC_TOKEN_TMBD") ||
        process.env.NEXT_PUBLIC_TOKEN_TMBD;
    const apiKey =
        configuredEnvironmentValue("TMDB_API_KEY", "NEXT_PUBLIC_API_KEY", "NEXT_PUBLIC_TMDB_API_KEY") ||
        process.env.NEXT_PUBLIC_TMDB_API_KEY ||
        process.env.NEXT_PUBLIC_API_KEY;

    if (!baseUrl || (!token && !apiKey)) {
        throw new Error("TMDB URL or credential is not configured.");
    }

    const headers = token?.split(".").length === 3
        ? { Authorization: `Bearer ${token}` }
        : undefined;
    const apiKeyQuery = apiKey && !headers
        ? `&api_key=${encodeURIComponent(apiKey)}`
        : "";

    const safePage = Math.max(page, 1);
    const searchUrl = `${baseUrl}/search/tv?query=${encodeURIComponent(trimmed)}&language=en-US&page=${safePage}${apiKeyQuery}`;

    const response = await providerRequest<
        TmdbResponse & { total_pages?: number }
    >(searchUrl, { headers });

    const items: TmdbTvSearchResult[] = (response.results ?? [])
        .slice(0, limit)
        .filter((item): item is TmdbResult & { id: number } => typeof item.id === "number")
        .map((item) => {
            const title = item.name ?? item.title ?? "Untitled";
            const year = getYear(item.first_air_date ?? item.release_date);
            const rating = typeof item.vote_average === "number" && item.vote_average > 0
                ? Number(item.vote_average.toFixed(1))
                : undefined;
            const genres = item.genre_ids
                ? item.genre_ids
                    .map((id) => TMDB_TV_GENRES[id])
                    .filter((g): g is string => Boolean(g))
                : undefined;

            return {
                id: `tmdb-${item.id}`,
                title,
                type: "series" as const,
                description: item.overview?.trim() || "No description available.",
                coverImage: item.poster_path
                    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                    : undefined,
                source: "TMDB",
                rating,
                year,
                releaseYear: year,
                genres,
                status: "Series",
            };
        });

    return {
        items,
        totalPages: response.total_pages ?? 1,
    };
}

/**
 * Movie Search for the global Explore search. Mirrors `searchTmdbTv` but
 * against TMDB's `/search/movie` endpoint, normalized to MediaItem with
 * `type: "movies"` so Explore cards render identically.
 */
export async function searchTmdbMovies(
    query: string,
    page = 1,
    limit = 8,
): Promise<{ items: MediaItem[]; totalPages: number }> {
    const trimmed = query.trim();
    if (!trimmed) {
        return { items: [], totalPages: 0 };
    }

    const baseUrl =
        configuredEnvironmentValue("NEXT_PUBLIC_TMDB_API_URL") ||
        process.env.NEXT_PUBLIC_TMDB_API_URL ||
        "https://api.themoviedb.org/3";
    const token =
        configuredEnvironmentValue("TMDB_READ_ACCESS_TOKEN", "NEXT_PUBLIC_TOKEN_TMBD") ||
        process.env.NEXT_PUBLIC_TOKEN_TMBD;
    const apiKey =
        configuredEnvironmentValue("TMDB_API_KEY", "NEXT_PUBLIC_API_KEY", "NEXT_PUBLIC_TMDB_API_KEY") ||
        process.env.NEXT_PUBLIC_TMDB_API_KEY ||
        process.env.NEXT_PUBLIC_API_KEY;

    if (!baseUrl || (!token && !apiKey)) {
        throw new Error("TMDB URL or credential is not configured.");
    }

    const headers = token?.split(".").length === 3
        ? { Authorization: `Bearer ${token}` }
        : undefined;
    const apiKeyQuery = apiKey && !headers
        ? `&api_key=${encodeURIComponent(apiKey)}`
        : "";

    const safePage = Math.max(page, 1);
    const searchUrl = `${baseUrl}/search/movie?query=${encodeURIComponent(trimmed)}&language=en-US&page=${safePage}${apiKeyQuery}`;

    const response = await providerRequest<
        TmdbResponse & { total_pages?: number }
    >(searchUrl, { headers });

    return {
        items: mapResults(response.results, "movies", limit),
        totalPages: response.total_pages ?? 1,
    };
}

async function getPopularTmdbPage(
    kind: "movie" | "tv",
    mediaType: "movies" | "series",
    limit: number,
    page: number,
): Promise<TmdbMoviesPage> {
    const baseUrl = configuredEnvironmentValue("NEXT_PUBLIC_TMDB_API_URL");
    const token = configuredEnvironmentValue("TMDB_READ_ACCESS_TOKEN", "NEXT_PUBLIC_TOKEN_TMBD");
    const apiKey = configuredEnvironmentValue("TMDB_API_KEY", "NEXT_PUBLIC_API_KEY");
    if (!baseUrl || (!token && !apiKey)) {
        throw new Error("TMDB URL or credential is not configured.");
    }

    const headers = token?.split(".").length === 3
        ? { Authorization: `Bearer ${token}` }
        : undefined;
    const query = apiKey && !headers
        ? `&api_key=${encodeURIComponent(apiKey)}`
        : "";

    const safePage = Math.max(page, 1);
    const response = await providerRequest<
        TmdbResponse & { total_pages?: number }
    >(
        `${baseUrl}/${kind}/popular?language=en-US&page=${safePage}${query}`,
        { headers },
    );
    return {
        items: mapResults(response.results, mediaType, limit),
        totalPages: response.total_pages ?? 1,
    };
}

interface TmdbGenreAuth {
    headers: Record<string, string> | undefined;
    apiKey: string | undefined;
}

function resolveTmdbGenreAuth(): TmdbGenreAuth {
    const token =
        configuredEnvironmentValue(
            "TMDB_READ_ACCESS_TOKEN",
            "NEXT_PUBLIC_TOKEN_TMBD",
        ) || process.env.NEXT_PUBLIC_TOKEN_TMBD;
    const apiKey =
        configuredEnvironmentValue(
            "TMDB_API_KEY",
            "NEXT_PUBLIC_API_KEY",
            "NEXT_PUBLIC_TMDB_API_KEY",
        ) ||
        process.env.NEXT_PUBLIC_TMDB_API_KEY ||
        process.env.NEXT_PUBLIC_API_KEY;
    const headers = token?.split(".").length === 3
        ? { Authorization: `Bearer ${token}` }
        : undefined;

    if (!headers && !apiKey) {
        throw new Error("TMDB credentials are not configured.");
    }

    return { headers, apiKey };
}

interface TmdbMedia {
    movies: MediaItem[];
    series: MediaItem[];
}

export async function getTmdbMedia(limit = 12): Promise<TmdbMedia> {
    const { movies, series } = await fetchTmdbMediaPage(limit, 1);
    return { movies, series };
}

export interface TmdbMediaPage extends TmdbMedia {
    /** True while TMDB still reports pages past the current one. */
    hasNextPage: boolean;
}

/**
 * Paged variant for the paginated Discover More route: one trending page per
 * kind (movie + TV). TMDB caps `page` at 500 for trending endpoints.
 */
export async function fetchTmdbMediaPage(
    limit = 12,
    page = 1,
): Promise<TmdbMediaPage> {
    const baseUrl = configuredEnvironmentValue("NEXT_PUBLIC_TMDB_API_URL");
    const token = configuredEnvironmentValue("TMDB_READ_ACCESS_TOKEN", "NEXT_PUBLIC_TOKEN_TMBD");
    const apiKey = configuredEnvironmentValue("TMDB_API_KEY", "NEXT_PUBLIC_API_KEY");
    if (!baseUrl || (!token && !apiKey)) {
        throw new Error("TMDB URL or credential is not configured.");
    }

    const headers = token?.split(".").length === 3
        ? { Authorization: `Bearer ${token}` }
        : undefined;
    const query = apiKey && !headers
        ? `&api_key=${encodeURIComponent(apiKey)}`
        : "";

    const safePage = Math.max(page, 1);
    const [movieResponse, seriesResponse] = await Promise.all([
        providerRequest<TmdbResponse & { total_pages?: number }>(
            `${baseUrl}/trending/movie/week?language=en-US&page=${safePage}${query}`,
            { headers },
        ),
        providerRequest<TmdbResponse & { total_pages?: number }>(
            `${baseUrl}/trending/tv/week?language=en-US&page=${safePage}${query}`,
            { headers },
        ),
    ]);

    const movieTotalPages = movieResponse.total_pages ?? 1;
    const seriesTotalPages = seriesResponse.total_pages ?? 1;
    return {
        movies: mapResults(movieResponse.results, "movies", limit),
        series: mapResults(seriesResponse.results, "series", limit),
        hasNextPage:
            safePage < movieTotalPages && safePage < seriesTotalPages,
    };
}

function mapResults(
    results: TmdbResult[] | undefined,
    type: "movies" | "series",
    limit: number,
    genreNames?: ReadonlyMap<number, string>,
): MediaItem[] {
    return (results ?? [])
        .slice(0, limit)
        .flatMap((result) => mapResult(result, type, genreNames));
}

function mapResult(
    result: TmdbResult,
    type: "movies" | "series",
    genreNames?: ReadonlyMap<number, string>,
): MediaItem[] {
    const title = result.title ?? result.name;
    if (!title) {
        return [];
    }

    const genres = result.genre_ids
        ?.map((genreId) => genreNames?.get(genreId))
        .filter((genre): genre is string => genre !== undefined);

    return [{
        id: `tmdb:${type}:${result.id}`,
        title,
        type,
        coverImage: result.poster_path
            ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
            : undefined,
        description: result.overview,
        rating: result.vote_average && result.vote_average > 0
            ? result.vote_average
            : undefined,
        releaseYear: getYear(result.release_date ?? result.first_air_date),
        genres: genres?.length ? genres : undefined,
    }];
}

function getYear(date: string | undefined): number | undefined {
    const year = Number(date?.slice(0, 4));
    return Number.isInteger(year) ? year : undefined;
}
