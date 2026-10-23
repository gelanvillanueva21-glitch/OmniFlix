// Jikan provider service: popular/top anime, mapped to the shared MediaItem
// format. Uses the configured Jikan proxy URL, which serves /top/anime with
// camelCase fields and pagination under `meta.pagination` (page is 1-1000).
import type { MediaItem } from "@/lib/media";
import { configuredEnvironmentValue, providerRequest } from "./provider-client.service";

interface JikanAnime {
    malId?: number;
    title?: string;
    imageUrl?: string;
    score?: number | null;
    startDate?: string | null;
}

interface JikanResponse {
    data?: JikanAnime[];
    meta?: { pagination?: { hasNextPage?: boolean } };
}

export interface JikanAnimePage {
    items: MediaItem[];
    hasNextPage: boolean;
}

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

/**
 * Backward-compatible wrapper for the Explore overview page: page 1 only.
 */
export async function getJikanAnime(limit = 12): Promise<MediaItem[]> {
    const { items } = await getJikanAnimePage(limit, 1);
    return items;
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

/** Extracts the first 4-digit year from a range like "Sep 2023 - Mar 2024". */
function getYear(date: string | null | undefined): number | undefined {
    const match = /\d{4}/.exec(date ?? "");
    const year = match ? Number(match[0]) : NaN;
    return Number.isInteger(year) ? year : undefined;
}
