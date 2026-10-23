import type { MediaItem } from "@/lib/media";
import { providerRequest, serverProviderUrl } from "./provider-client.service";

interface SuwayomiResponse<T> {
    data?: T;
    errors?: Array<{ message?: string }>;
}

interface SuwayomiExtension {
    source: { nodes: SuwayomiSource[] };
}

interface SuwayomiSource {
    id: string;
    lang: string;
    supportsLatest: boolean;
    displayName: string;
}

const ALLOWED_NON_ENGLISH_SOURCES = new Set(["Comick (Unoriginal) (ALL)"]);
export const COMICK_SOURCE_TYPE = "comick-unoriginal";

function sourceTypeFromDisplayName(displayName: string): string {
    if (displayName === "Comick (Unoriginal) (ALL)") {
        return COMICK_SOURCE_TYPE;
    }

    return displayName
        .toLowerCase()
        .replace(/\([^)]*\)/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

interface SuwayomiManga {
    id: number;
    title: string;
    thumbnailUrl?: string | null;
    description?: string | null;
    genre: string[];
}

const EXTENSIONS_QUERY = `
    { extensions(condition: { isInstalled: true }) {
        nodes { source { nodes { id lang supportsLatest displayName } } }
    } }
`;

const MANGA_QUERY = `
    mutation FetchSourceManga(
        $source: LongString!,
        $page: Int!,
        $type: FetchSourceMangaType!,
        $query: String
    ) {
        fetchSourceManga(input: { source: $source, page: $page, type: $type, query: $query }) {
            hasNextPage
            mangas { id title thumbnailUrl description genre }
        }
    }
`;

export interface SuwayomiCatalogPage {
    items: MediaItem[];
    hasNextPage: boolean;
}

export interface SuwayomiSourceInfo {
    type: string;
    id: string;
    lang: string;
    displayName: string;
    supportsLatest: boolean;
}

/**
 * One catalog request against a source. `type` uses Suwayomi's
 * FetchSourceMangaType; POPULAR and LATEST are plain catalogs, SEARCH
 * requires the `query` input. All fields verified against the live server.
 */
export async function fetchSuwayomiCatalog(
    sourceType: string,
    page: number,
    type: "POPULAR" | "LATEST" | "SEARCH",
    query?: string,
): Promise<SuwayomiCatalogPage> {
    const source = (await getSuwayomiSources()).find(
        (candidate) => candidate.type === sourceType,
    );
    if (!source) {
        throw new Error(`Unsupported comic source: ${sourceType}`);
    }

    return fetchSuwayomiCatalogById(
        source.id,
        page,
        type,
        query,
    );
}

async function fetchSuwayomiCatalogById(
    sourceId: string,
    page: number,
    type: "POPULAR" | "LATEST" | "SEARCH",
    query?: string,
): Promise<SuwayomiCatalogPage> {
    const baseUrl = serverProviderUrl("NEXT_PUBLIC_SUWAYOMI_API_URL", "suwayomi", 4567);
    if (!baseUrl) throw new Error("Suwayomi URL is not configured.");
    if (type === "SEARCH" && !query) {
        throw new Error("A query is required for source search.");
    }

    const response = await graphQl<{
        fetchSourceManga: { hasNextPage: boolean; mangas: SuwayomiManga[] } | null;
    }>(
        baseUrl,
        MANGA_QUERY,
        { source: sourceId, page, type, query },
    );

    const catalog = response.fetchSourceManga;
    return {
        items: mapMangaToMediaItems(sourceId, catalog?.mangas ?? []),
        hasNextPage: catalog?.hasNextPage ?? false,
    };
}

/**
 * Installed sources discovered at runtime. Duplicates removed because one
 * extension may expose the same source through several extension nodes.
 */
export async function getSuwayomiSources(): Promise<SuwayomiSourceInfo[]> {
    const baseUrl = serverProviderUrl("NEXT_PUBLIC_SUWAYOMI_API_URL", "suwayomi", 4567);
    if (!baseUrl) throw new Error("Suwayomi URL is not configured.");

    const extensions = await graphQl<{ extensions: { nodes: SuwayomiExtension[] } }>(
        baseUrl,
        EXTENSIONS_QUERY,
    );
    const sources = extensions.extensions.nodes
        .flatMap((extension) => extension.source.nodes)
        .filter(
            (source) =>
                source.lang === "en" ||
                ALLOWED_NON_ENGLISH_SOURCES.has(source.displayName),
        )
        .filter((source, index, allSources) =>
            allSources.findIndex((candidate) => candidate.id === source.id) === index,
        );

    return sources
        .map((source) => ({
            type: sourceTypeFromDisplayName(source.displayName),
            id: source.id,
            lang: source.lang,
            displayName: source.displayName,
            supportsLatest: source.supportsLatest,
        }))
        .sort((first, second) => {
            // English sources plus explicitly allowed global sources are sorted by name.
            return first.displayName.localeCompare(second.displayName);
        });
}

/** Explore route hook: popular/latest from the first responding English sources. */
export async function getSuwayomiComics(limit = 12): Promise<MediaItem[]> {
    const sources = await getSuwayomiSources();
    const englishSources = sources.filter(
        (source) =>
            source.lang === "en" && source.type !== COMICK_SOURCE_TYPE,
    );

    const results: MediaItem[] = [];
    let failedSourceRequests = 0;

    for (const source of englishSources.slice(0, 4)) {
        try {
            const response = await fetchSuwayomiCatalog(
                source.type,
                1,
                source.supportsLatest ? "LATEST" : "POPULAR",
            );
            results.push(...response.items);
        } catch {
            // A single unavailable extension must not prevent other installed sources from loading.
            failedSourceRequests += 1;
        }
        if (results.length >= limit) break;
    }
    if (
        englishSources.length > 0 &&
        failedSourceRequests === Math.min(englishSources.length, 4) &&
        results.length === 0
    ) {
        throw new Error(
            "Suwayomi could not retrieve listings from the installed sources.",
        );
    }
    return results.slice(0, limit);
}

function mapMangaToMediaItems(
    sourceIdentifier: string,
    mangas: SuwayomiManga[],
): MediaItem[] {
    return mangas.flatMap((manga) => {
        if (!manga.title) {
            return [];
        }

        return [{
            id: `suwayomi:${sourceIdentifier}:${manga.id}`,
            title: manga.title,
            type: "comics" as const,
            coverImage: manga.thumbnailUrl
                ? `/api/provider-image?provider=suwayomi&path=${encodeURIComponent(manga.thumbnailUrl)}`
                : undefined,
            description: manga.description ?? undefined,
            genres: manga.genre,
        }];
    });
}

async function graphQl<T>(
    baseUrl: string,
    query: string,
    variables?: Record<string, string | number | undefined>,
): Promise<T> {
    const response = await providerRequest<SuwayomiResponse<T>>(
        `${baseUrl}/api/graphql`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, variables }),
        },
    );

    if (response.errors?.length || !response.data) {
        throw new Error(
            response.errors?.[0]?.message ?? "Suwayomi returned no data.",
        );
    }

    return response.data;
}

