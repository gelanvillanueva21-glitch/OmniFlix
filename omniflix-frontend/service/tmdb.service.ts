import type { MediaItem } from "@/lib/media";
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
}

interface TmdbResponse {
    results?: TmdbResult[];
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
