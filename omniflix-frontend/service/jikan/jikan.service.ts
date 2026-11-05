// Jikan provider service: popular/top anime, mapped to the shared MediaItem
// format. Uses the configured Jikan proxy URL, which serves /top/anime with
// camelCase fields and pagination under `meta.pagination` (page is 1-1000).
import type { Genre, MediaItem, SeriesSearchResult } from "@/lib/media";
import { configuredEnvironmentValue, providerRequest } from "../provider-client.service";
import type {
    JikanAnime,
    JikanAnimePage,
    JikanGenreListResponse,
    JikanGenreResultsResponse,
    JikanResponse,
    JikanSearchItem,
} from "../types/JikanFetchPayload";
import { resolveProviderBaseUrl } from "@/lib/baseUrl";

export type { JikanAnimePage } from "../types/JikanFetchPayload";

export type JikanAnimeSearchResult = SeriesSearchResult;
export type JikanGenreMediaType = "anime" | "manga";

/** The proxy only accepts pages 1-1000 for /top/anime. */
const JIKAN_MAX_PAGE = 1000;

/**
 * Popular anime for the Series Explore section, mapped to MediaItem.
 * `page` follows the proxy's native /top/anime pagination.
 */
export async function getJikanAnimePage(
    limit = 12,
    page = 1,
): Promise<JikanAnimePage> {
    const safePage = Math.max(page, 1);
    const configuredUrl = configuredEnvironmentValue("NEXT_PUBLIC_JIKAN_API_URL");
    if (!configuredUrl) {
        throw new Error("Jikan URL is not configured.");
    }

    const url = new URL(configuredUrl);
    const path = url.pathname
        .replace(/\/top\/anime\/?$/, "")
        .replace(/\/$/, "") || "/v1";
    url.pathname = `${path}/top/anime`;
    url.search = `page=${safePage}`;
    const response = await providerRequest<JikanResponse>(url.toString());
    const items = (response.data ?? [])
        .slice(0, limit)
        .flatMap((anime) => mapAnimeToMediaItems(anime));
    const hasNextPage = response.meta?.pagination?.hasNextPage === true
        && safePage < JIKAN_MAX_PAGE;
    return { items, hasNextPage };
}

export async function getJikanGenres(
    mediaType: JikanGenreMediaType,
): Promise<Genre[]> {
    const response = await providerRequest<JikanGenreListResponse>(
        `${getJikanBaseUrl()}/genres/${mediaType}`,
    );

    return (response.data ?? []).flatMap((genre) => {
        const genreId = genre.malId ?? genre.mal_id;
        if (
            genre.type !== "genres" ||
            typeof genreId !== "number" ||
            typeof genre.name !== "string" ||
            !genre.name.trim()
        ) {
            return [];
        }
        return [{ id: String(genreId), label: genre.name }];
    });
}

/**
 * One provider-native genre-filtered page. The proxy uses `genres` with a
 * MyAnimeList genre ID and reports continuation under `meta.pagination`.
 */
export async function getJikanGenrePage(
    mediaType: JikanGenreMediaType,
    genreId: string,
    page: number,
): Promise<{ items: MediaItem[]; hasNextPage: boolean }> {
    const searchParams = new URLSearchParams({
        genres: genreId,
        page: String(page),
    });
    const response = await providerRequest<JikanGenreResultsResponse>(
        `${getJikanBaseUrl()}/${mediaType}?${searchParams}`,
    );

    return {
        items: (response.data ?? []).flatMap((item) =>
            mapJikanGenreItem(item, mediaType),
        ),
        hasNextPage: response.meta?.pagination?.hasNextPage === true,
    };
}

/**
 * Backward-compatible wrapper for the Explore overview page: page 1 only.
 */
export async function getJikanAnime(limit = 12): Promise<MediaItem[]> {
    const { items } = await getJikanAnimePage(limit, 1);
    return items;
}

/**
 * Anime Search for the Series Explore section. Queries Jikan's `/anime` search endpoint,
 * normalizes responses to the unified SeriesSearchResult format with source "jikan",
 * extracts genres, scores, dates, and episodes.
 */
export async function searchJikanAnime(
    query: string,
    page = 1,
    limit = 20,
): Promise<{ items: JikanAnimeSearchResult[]; hasNextPage: boolean }> {
    const trimmed = query.trim();
    if (!trimmed) {
        return { items: [], hasNextPage: false };
    }

    const safePage = Math.max(page, 1);
    const configuredUrl =
        configuredEnvironmentValue("NEXT_PUBLIC_JIKAN_API_URL") ||
        process.env.NEXT_PUBLIC_JIKAN_API_URL ||
        "https://jikan.lucashdo.com/v1/top/anime";

    if (!configuredUrl) {
        throw new Error("Jikan URL is not configured.");
    }

    const url = new URL(configuredUrl);
    const path = url.pathname
        .replace(/\/top\/anime\/?$/, "")
        .replace(/\/$/, "") || "/v1";

    url.pathname = `${path}/anime`;
    url.search = `q=${encodeURIComponent(trimmed)}&page=${safePage}`;

    const response = await providerRequest<{
        data?: JikanSearchItem[];
        meta?: { pagination?: { hasNextPage?: boolean } };
        pagination?: { has_next_page?: boolean };
    }>(url.toString());

    const items: JikanAnimeSearchResult[] = (response.data ?? [])
        .slice(0, limit)
        .flatMap((anime) => {
            const malId = anime.mal_id ?? anime.malId;
            const title = anime.title_english || anime.title;
            if (!malId || !title) return [];

            const coverImage =
                anime.images?.webp?.large_image_url ||
                anime.images?.jpg?.large_image_url ||
                anime.imageUrl ||
                undefined;

            const rating =
                typeof anime.score === "number" && anime.score > 0
                    ? Number(anime.score.toFixed(1))
                    : undefined;

            const year =
                anime.year ??
                getYear(anime.startDate ?? anime.aired?.from);

            const genresList = [
                ...(anime.genres ?? []),
                ...(anime.themes ?? []),
            ]
                .map((g) => (typeof g === "string" ? g : g?.name))
                .filter((g): g is string => Boolean(g));

            const genres = genresList.length > 0 ? genresList : undefined;
            const status = anime.status || (anime.type ? anime.type : "Anime");
            const episodes =
                typeof anime.episodes === "number" && anime.episodes > 0
                    ? anime.episodes
                    : undefined;

            return [{
                id: `jikan-${malId}`,
                title,
                type: "series" as const,
                description: anime.synopsis?.trim() || "No description available.",
                coverImage,
                source: "Anime",
                rating,
                year,
                releaseYear: year,
                genres,
                status,
                episodes,
            }];
        });

    const hasNextPage =
        response.meta?.pagination?.hasNextPage === true ||
        response.pagination?.has_next_page === true;

    return { items, hasNextPage };
}

function mapAnimeToMediaItems(anime: JikanAnime): MediaItem[] {
    if (!anime.malId || !anime.title) {
        return [];
    }

    return [{
        id: `jikan:${anime.malId}`,
        title: anime.title,
        type: "series",
        coverImage: anime.imageUrl,
        rating: anime.score ?? undefined,
        releaseYear: getYear(anime.startDate),
    }];
}

function mapJikanGenreItem(
    item: JikanSearchItem,
    mediaType: JikanGenreMediaType,
): MediaItem[] {
    const malId = item.mal_id ?? item.malId;
    const title = item.title_english || item.title;
    if (typeof malId !== "number" || !title) {
        return [];
    }

    const genreNames = (item.genres ?? [])
        .map((genre) => (typeof genre === "string" ? genre : genre.name))
        .filter((genre): genre is string => Boolean(genre));
    const year = item.year ?? getYear(item.startDate ?? item.aired?.from);

    return [{
        id: mediaType === "manga"
            ? `jikan:manga:${malId}`
            : `jikan:${malId}`,
        title,
        type: mediaType === "manga" ? "comics" : "series",
        description: item.synopsis?.trim() || undefined,
        coverImage:
            item.images?.webp?.large_image_url ||
            item.images?.jpg?.large_image_url ||
            item.imageUrl ||
            undefined,
        genres: genreNames.length ? genreNames : undefined,
        rating:
            typeof item.score === "number" && item.score > 0
                ? Number(item.score.toFixed(1))
                : undefined,
        releaseYear: year,
        source: mediaType === "manga" ? "Jikan Manga" : "Anime",
    }];
}

function getJikanBaseUrl(): string {
    return resolveProviderBaseUrl({
        envVar: "NEXT_PUBLIC_JIKAN_API_URL",
        stripJikanPath: true,
        serviceName: "Jikan",
    });
}

/** Extracts the first 4-digit year from a range like "Sep 2023 - Mar 2024". */
function getYear(date: string | null | undefined): number | undefined {
    const match = /\d{4}/.exec(date ?? "");
    const year = match ? Number(match[0]) : NaN;
    return Number.isInteger(year) ? year : undefined;
}
