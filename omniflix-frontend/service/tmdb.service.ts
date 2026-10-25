import type { MediaItem, SeriesSearchResult } from "@/lib/media";
import { configuredEnvironmentValue, providerRequest } from "./provider-client.service";

interface TmdbResult {
    id: number;
    title?: string;
    name?: string;
    overview?: string;
    poster_path?: string;
    vote_average?: number;
    release_date?: string;
    first_air_date?: string;
    genre_ids?: number[];
}

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

interface TmdbMedia {
    movies: MediaItem[];
    series: MediaItem[];
}

export async function getTmdbMedia(limit = 12): Promise<TmdbMedia> {
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

    const [movieResponse, seriesResponse] = await Promise.all([
        providerRequest<TmdbResponse>(
            `${baseUrl}/trending/movie/week?language=en-US${query}`,
            { headers },
        ),
        providerRequest<TmdbResponse>(
            `${baseUrl}/trending/tv/week?language=en-US${query}`,
            { headers },
        ),
    ]);

    return {
        movies: mapResults(movieResponse.results, "movies", limit),
        series: mapResults(seriesResponse.results, "series", limit),
    };
}

function mapResults(
    results: TmdbResult[] | undefined,
    type: "movies" | "series",
    limit: number,
): MediaItem[] {
    return (results ?? [])
        .slice(0, limit)
        .flatMap((result) => mapResult(result, type));
}

function mapResult(
    result: TmdbResult,
    type: "movies" | "series",
): MediaItem[] {
    const title = result.title ?? result.name;
    if (!title) {
        return [];
    }

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
    }];
}

function getYear(date: string | undefined): number | undefined {
    const year = Number(date?.slice(0, 4));
    return Number.isInteger(year) ? year : undefined;
}
