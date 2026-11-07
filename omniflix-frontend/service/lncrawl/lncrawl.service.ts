import "server-only";

import type { Genre, MediaItem } from "@/lib/media";
import { htmlToText } from "@/lib/html";
import {
    configuredEnvironmentValue,
    providerRequest,
    serverProviderUrl,
} from "../provider-client.service";

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

export interface LncrawlNovelsPage {
    items: MediaItem[];
    total: number;
    /** True while the server reports more novels past the current offset. */
    hasNextPage: boolean;
}

const LNCRAWL_RECOMMENDATION_LIMIT = 8;

export async function getLncrawlNovels(
    limit = 12,
    offset = 0,
): Promise<LncrawlNovelsPage> {
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
        `${baseUrl}/api/novels?limit=${limit}&offset=${Math.max(offset, 0)}&sort=updated`,
        { headers:
            { Authorization: `Bearer ${accessToken}` }
        },
    );
    const novels = Array.isArray(response)
        ? response
        : response.items ?? response.novels ?? [];

    const novelItems = novels.flatMap((novel) => {
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
    const total = Array.isArray(response)
        ? novels.length
        : (response.total ?? novels.length);

    return {
        items: novelItems,
        total,
        // With a `total` count the offset walk knows when to stop; when the
        // server omits `total`, a full page means more content likely follows.
        hasNextPage:
            !Array.isArray(response) && response.total !== undefined
                ? offset + novelItems.length < response.total
                : novelItems.length >= limit,
    };
}

/**
 * Paged variant for the paginated Discover More route: the same `sort=updated`
 * listing walked by `offset` instead of a page number.
 */
export function getLncrawlNovelsPage(
    limit = 12,
    page = 1,
): Promise<LncrawlNovelsPage> {
    return getLncrawlNovels(limit, (Math.max(page, 1) - 1) * limit);
}

export async function getLncrawlGenreTags(): Promise<Genre[]> {
    const baseUrl = serverProviderUrl(
        "NEXT_PUBLIC_LNCRAWL_API_URL",
        "lncrawl",
        8181,
    );
    if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_LNCRAWL_API_URL is not configured.");
    }

    const accessToken = await getLncrawlAccessToken(baseUrl);
    const tags = await providerRequest<Record<string, unknown>>(
        `${baseUrl}/api/novel/tags`,
        { headers: { Authorization: "Bearer " + accessToken } },
    );

    return Object.entries(tags)
        .filter(
            ([tag, count]) =>
                tag.trim().length > 0 &&
                typeof count === "number" &&
                Number.isFinite(count),
        )
        .map(([tag]) => ({ id: tag, label: tag }))
        .sort((first, second) => first.label.localeCompare(second.label));
}

/** Similarity-ranked recommendations from LNCrawl for one novel. */
export async function getRecommendedLncrawlNovels(
    novelId: string,
    limit = LNCRAWL_RECOMMENDATION_LIMIT,
): Promise<MediaItem[]> {
    const baseUrl = serverProviderUrl(
        "NEXT_PUBLIC_LNCRAWL_API_URL",
        "lncrawl",
        8181,
    );
    if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_LNCRAWL_API_URL is not configured.");
    }

    const accessToken = await getLncrawlAccessToken(baseUrl);
    const searchParams = new URLSearchParams({ limit: String(limit) });
    const response = await providerRequest<unknown>(
        `${baseUrl}/api/novel/${encodeURIComponent(novelId)}/recommended?${searchParams}`,
        { headers: { Authorization: "Bearer " + accessToken } },
    );
    if (!Array.isArray(response)) {
        throw new Error(
            "LNCrawl recommendations response did not contain a novel list.",
        );
    }

    return response.flatMap((novel: unknown) => {
        if (!isLncrawlNovel(novel)) {
            return [];
        }
        const title = novel.title ?? novel.name;
        const identifier = novel.id;
        if (!title || identifier === undefined) {
            return [];
        }
        return [mapNovelToMediaItem(novel, title, identifier)];
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

/**
 * Novel search for the global Explore search. The installed LNcrawl build
 * accepts a `search` parameter on `/api/novels` (verified against the running
 * server: `search=Leveling` filters titles while `sort` still applies).
 * Returns the same normalized MediaItem mapping as the browse listings.
 */
export async function searchLncrawlNovels(
    query: string,
    limit = 8,
): Promise<MediaItem[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const baseUrl = serverProviderUrl("NEXT_PUBLIC_LNCRAWL_API_URL", "lncrawl", 8181);
    if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_LNCRAWL_API_URL is not configured.");
    }

    const accessToken = await getLncrawlAccessToken(baseUrl);
    const response = await providerRequest<LncrawlListResponse | LncrawlNovel[]>(
        `${baseUrl}/api/novels?limit=${limit}&offset=0&search=${encodeURIComponent(trimmed)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const novels = Array.isArray(response)
        ? response
        : response.items ?? response.novels ?? [];

    return novels.flatMap((novel) => {
        const title = novel.title ?? novel.name;
        const identifier = novel.id;
        if (!title || identifier === undefined) return [];

        return [mapNovelToMediaItem(novel, title, identifier)];
    });
}

/** Logs in once and caches the bearer token for the process lifetime. */
let cachedLncrawlToken: Promise<string> | undefined;

export function getLncrawlAccessToken(baseUrl: string): Promise<string> {
    cachedLncrawlToken ??= (async () => {
        const username = configuredEnvironmentValue("LNCRAWL_USERNAME");
        const password = configuredEnvironmentValue("LNCRAWL_PASSWORD");
        if (!username || !password) {
            throw new Error(
                "LNCrawl requires LNCRAWL_USERNAME and LNCRAWL_PASSWORD."
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
        return accessToken;
    })();

    return cachedLncrawlToken;
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
        source: "lncrawl",
        sourceLabel: "Novels",
        coverImage: novel.thumbnail ?? novel.cover ?? novel.cover_url,
        // LNcrawl synopses arrive as HTML (often wrapped per-paragraph in
        // <p><html><body>…); normalize to plain text before caching/serving.
        description: htmlToText(novel.description ?? novel.synopsis) || undefined,
        genres: novel.tags,
        releaseYear: releaseYear,
        rating: novel.popularity,
    };
}

function isLncrawlNovel(novel: unknown): novel is LncrawlNovel {
    if (
        typeof novel !== "object" ||
        novel === null ||
        Array.isArray(novel)
    ) {
        return false;
    }

    const record = novel as Record<string, unknown>;
    const hasIdentifier =
        typeof record.id === "string" || typeof record.id === "number";
    const hasTitle =
        (record.title === undefined || typeof record.title === "string") &&
        (record.name === undefined || typeof record.name === "string") &&
        (typeof record.title === "string" || typeof record.name === "string");

    return (
        hasIdentifier &&
        hasTitle &&
        isOptionalString(record.description) &&
        isOptionalString(record.synopsis) &&
        isOptionalString(record.thumbnail) &&
        isOptionalString(record.cover) &&
        isOptionalString(record.cover_url) &&
        isOptionalStringOrNumber(record.updatedAt) &&
        isOptionalStringOrNumber(record.updated_at) &&
        isOptionalStringArray(record.tags) &&
        isOptionalNumber(record.popularity)
    );
}

function isOptionalString(value: unknown): boolean {
    return value === undefined || typeof value === "string";
}

function isOptionalStringOrNumber(value: unknown): boolean {
    return value === undefined || typeof value === "string" || typeof value === "number";
}

function isOptionalStringArray(value: unknown): boolean {
    return (
        value === undefined ||
        (Array.isArray(value) &&
            value.every((tag: unknown) => typeof tag === "string"))
    );
}

function isOptionalNumber(value: unknown): boolean {
    return value === undefined || typeof value === "number";
}

function getYear(date: string | undefined): number | undefined {
    if (!date) return undefined;
    const year = Number(date.slice(0, 4));
    return Number.isInteger(year) ? year : undefined;
}
