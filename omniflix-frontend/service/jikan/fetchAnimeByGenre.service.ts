/**
 * Jikan genre service: one page of anime for a MyAnimeList genre ID, mapped to
 * the shared MediaItem format for the Series "You Might Also Like" carousel.
 *
 * Endpoint — GET {NEXT_PUBLIC_JIKAN_API_URL}/anime?genres={genreId}&page={page}
 * The genre ID must be the Jikan `malId` taken from the anime's genre data;
 * TMDB genre IDs are never valid here and vice versa. The proxy serves
 * camelCase fields and reports continuation under `meta.pagination`.
 */
import "server-only";

import type { MediaItem } from "@/lib/media";
import { providerRequest } from "../provider-client.service";
import { resolveProviderBaseUrl } from "@/lib/baseUrl";
import type {
    JikanGenreResultsResponse,
    JikanSearchItem,
} from "../types/JikanFetchPayload";

export interface JikanAnimeByGenrePage {
    items: MediaItem[];
    /** True when the proxy reports another anime page for this genre. */
    hasNextPage: boolean;
}

/**
 * One page of anime for the given Jikan genre ID (`malId`), ordered by the
 * provider's default relevance. Returns items shaped exactly like the
 * `MediaItem` entries `MediaCarousel` already renders.
 */
export async function fetchAnimeByGenre(
    genreId: string,
    page = 1,
): Promise<JikanAnimeByGenrePage> {
    const safePage = Math.max(page, 1);
    const baseUrl = getJikanBaseUrl();
    const searchParams = new URLSearchParams({
        genres: genreId,
        page: String(safePage),
    });

    const response = await providerRequest<JikanGenreResultsResponse>(
        `${baseUrl}/anime?${searchParams}`,
    );

    return {
        items: (response.data ?? []).flatMap(mapAnimeToMediaItem),
        hasNextPage: response.meta?.pagination?.hasNextPage === true,
    };
}

function getJikanBaseUrl(): string {
    return resolveProviderBaseUrl({
        envVar: "NEXT_PUBLIC_JIKAN_API_URL",
        stripJikanPath: true,
        serviceName: "Jikan",
    });
}

/**
 * Same normalization as the existing Jikan genre pages: provider-aware
 * `jikan:{malId}` id, best available title and cover, score rounded to one
 * decimal, and the year derived from `year` or the aired start date. Entries
 * missing a MyAnimeList ID or title are dropped.
 */
function mapAnimeToMediaItem(anime: JikanSearchItem): MediaItem[] {
    const malId = anime.malId ?? anime.mal_id;
    const title = anime.title_english || anime.title;
    if (typeof malId !== "number" || !title) {
        return [];
    }

    const year = anime.year ?? getYear(anime.startDate ?? anime.aired?.from);

    return [{
        id: `jikan:${malId}`,
        title,
        type: "series",
        description: anime.synopsis?.trim() || undefined,
        coverImage:
            anime.images?.webp?.large_image_url ||
            anime.images?.jpg?.large_image_url ||
            anime.imageUrl ||
            undefined,
        rating:
            typeof anime.score === "number" && anime.score > 0
                ? Number(anime.score.toFixed(2))
                : undefined,
        releaseYear: year,
        source: "Anime",
    }];
}

function getYear(date: string | null | undefined): number | undefined {
    const match = /\d{4}/.exec(date ?? "");
    const year = match ? Number(match[0]) : NaN;
    return Number.isInteger(year) ? year : undefined;
}
