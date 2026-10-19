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
    thumbnail?: string;
    cover?: string;
    tags?: string[];
    updated_at?: string;
    updatedAt?: string;
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

    const login = await providerRequest<{ access_token?: string }>(
        `${baseUrl}/api/auth/login`,
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        },
    );

    if (!login.access_token) {
        throw new Error("LNCrawl authentication did not return an access token.");
    }

    const response = await providerRequest<LncrawlListResponse | LncrawlNovel[]>(
        `${baseUrl}/api/novels?limit=${limit}&offset=0&sort=updated`,
        { headers: 
            { Authorization: `Bearer ${login.access_token}` } 
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
    return {
        id: `lncrawl:${identifier}`,
        title,
        type: "novels",
        coverImage: novel.thumbnail ?? novel.cover,
        description: novel.description,
        genres: novel.tags,
        releaseYear: getYear(novel.updated_at ?? novel.updatedAt),
    };
}

function getYear(date: string | undefined): number | undefined {
    if (!date) return undefined;
    const year = Number(date.slice(0, 4));
    return Number.isInteger(year) ? year : undefined;
}
