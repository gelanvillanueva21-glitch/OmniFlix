import type { MediaItem } from "@/lib/media";
import { configuredEnvironmentValue, providerRequest } from "./provider-client.service";

interface JikanAnime {
    mal_id?: number;
    title?: string;
    title_english?: string | null;
    images?: { jpg?: { image_url?: string } };
    score?: number | null;
    year?: number | null;
    aired?: { from?: string | null };
    synopsis?: string | null;
    genres?: Array<{ name?: string }>;
}

interface JikanResponse {
    data?: JikanAnime[];
}

export async function getJikanAnime(limit = 12): Promise<MediaItem[]> {
    const configuredUrl = configuredEnvironmentValue("NEXT_PUBLIC_JIKAN_API_URL");
    if (!configuredUrl) {
        throw new Error("Jikan URL is not configured.");
    }

    const url = new URL(configuredUrl);
    const path = url.pathname
        .replace(/\/top\/anime\/?$/, "")
        .replace(/\/$/, "") || "/v4";
    url.pathname = `${path}/top/anime`;
    url.search = "page=1";
    const response = await providerRequest<JikanResponse>(url.toString());
    return (response.data ?? [])
        .slice(0, limit)
        .flatMap((anime) => mapAnimeToMediaItems(anime));
}

function mapAnimeToMediaItems(anime: JikanAnime): MediaItem[] {
    if (!anime.mal_id || !anime.title) {
        return [];
    }

    return [{
        id: `jikan:${anime.mal_id}`,
        title: anime.title_english ?? anime.title,
        type: "series",
        coverImage: anime.images?.jpg?.image_url,
        description: anime.synopsis ?? undefined,
        genres: anime.genres?.flatMap((genre) =>
            genre.name ? [genre.name] : [],
        ),
        rating: anime.score ?? undefined,
        releaseYear: anime.year ?? getYear(anime.aired?.from),
    }];
}

function getYear(date: string | null | undefined): number | undefined {
    const year = Number(date?.slice(0, 4));
    return Number.isInteger(year) ? year : undefined;
}
