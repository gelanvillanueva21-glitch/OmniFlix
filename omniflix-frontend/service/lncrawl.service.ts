import type { MediaItem } from "@/lib/media";
import {
    configuredEnvironmentValue,
    providerRequest,
    serverProviderUrl,
} from "./provider-client.service";

interface LncrawlNovel {
    id?: number | string;
    title?: string;
    name?: string;
    description?: string;
    synopsis?: string;
    thumbnail?: string;
    cover?: string;
    cover_url?: string;
    tags?: string[];
    domain?: string;
    popularity?: number;
    updated_at?: string | number;
    updatedAt?: string | number;
}

interface LncrawlListResponse {
    items?: LncrawlNovel[];
    novels?: LncrawlNovel[];
    total?: number;
}

export async function getLncrawlNovels(limit = 12): Promise<MediaItem[]> {
    const baseUrl = serverProviderUrl("NEXT_PUBLIC_LNCRAWL_API_URL", "lncrawl", 8181);
    const username = configuredEnvironmentValue("LNCRAWL_USERNAME");
    const password = configuredEnvironmentValue("LNCRAWL_PASSWORD");
    if (
        !baseUrl ||
        !username ||
        !password
    ) {
        throw new Error(
            "LNCrawl requires LNCRAWL_USERNAME, LNCRAWL_PASSWORD, and NEXT_PUBLIC_LNCRAWL_API_URL."
        );
    }

    const login = await providerRequest<{
        access_token?: string;
        token?: string;
    }>(
        `${baseUrl}/api/auth/login`,
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The installed LNcrawl build identifies users by email; fall back to
        // the username so both deployments keep working.
        body: JSON.stringify({
            email: username,
            username,
            password,
        }),
        },
    );

    const accessToken = login.access_token ?? login.token;
    if (!accessToken) {
        throw new Error("LNCrawl authentication did not return an access token.");
    }

    const response = await providerRequest<LncrawlListResponse | LncrawlNovel[]>(
        `${baseUrl}/api/novels?limit=${limit}&offset=0&sort=updated`,
        { headers:
            { Authorization: `Bearer ${accessToken}` }
        },
    );
    const novels = Array.isArray(response)
        ? response
        : response.items ?? response.novels ?? [];

    return novels.flatMap((novel) => {
        const title = novel.title ?? novel.name;
        const identifier = novel.id;
        if (!title || identifier === undefined)
            return [];

        return [mapNovelToMediaItem(
            novel,
            title,
            identifier
        )];
    });
}

/**
 * Popular novels for the sidebar, ranked by LNcrawl's native popularity
 * score (accumulated reader visits tracked per novel on the server).
 *
 * Verified against the running LNcrawl instance (`GET /api/novels` exposes
 * `sort=popular` and every `Novel` carries a `popularity` integer).
 */
export async function getPopularLncrawlNovels(limit = 10): Promise<MediaItem[]> {
    const baseUrl = serverProviderUrl("NEXT_PUBLIC_LNCRAWL_API_URL", "lncrawl", 8181);
    const username = configuredEnvironmentValue("LNCRAWL_USERNAME");
    const password = configuredEnvironmentValue("LNCRAWL_PASSWORD");
    if (
        !baseUrl ||
        !username ||
        !password
    ) {
        throw new Error(
            "LNCrawl requires LNCRAWL_USERNAME, LNCRAWL_PASSWORD, and NEXT_PUBLIC_LNCRAWL_API_URL."
        );
    }

    const login = await providerRequest<{
        access_token?: string;
        token?: string;
    }>(
        `${baseUrl}/api/auth/login`,
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: username,
            username,
            password,
        }),
        },
    );

    const accessToken = login.access_token ?? login.token;
    if (!accessToken) {
        throw new Error("LNCrawl authentication did not return an access token.");
    }

    const response = await providerRequest<LncrawlListResponse | LncrawlNovel[]>(
        `${baseUrl}/api/novels?limit=${limit}&offset=0&sort=popular`,
        { headers:
            { Authorization: `Bearer ${accessToken}` }
        },
    );
    const novels = Array.isArray(response)
        ? response
        : response.items ?? response.novels ?? [];

    return novels.flatMap((novel) => {
        const title = novel.title ?? novel.name;
        const identifier = novel.id;
        if (!title || identifier === undefined)
            return [];

        return [mapNovelToMediaItem(
            novel,
            title,
            identifier
        )];
    });
}

function mapNovelToMediaItem(
    novel: LncrawlNovel,
    title: string,
    identifier: number | string,
): MediaItem {
    const updated = novel.updated_at ?? novel.updatedAt;
    const releaseYear = typeof updated === "number"
        ? new Date(updated).getUTCFullYear()
        : getYear(updated);
    return {
        id: `lncrawl:${identifier}`,
        title,
        type: "novels",
        coverImage: novel.thumbnail ?? novel.cover ?? novel.cover_url,
        description: novel.description ?? novel.synopsis,
        genres: novel.tags,
        releaseYear: releaseYear,
        rating: novel.popularity,
    };
}

function getYear(date: string | undefined): number | undefined {
    if (!date) return undefined;
    const year = Number(date.slice(0, 4));
    return Number.isInteger(year) ? year : undefined;
}
