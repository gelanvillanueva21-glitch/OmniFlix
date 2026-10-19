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
}

interface SuwayomiManga {
    id: number;
    title: string;
    thumbnailUrl?: string;
    description?: string;
    genre: string[];
}

const EXTENSIONS_QUERY = `
    { extensions(condition: { isInstalled: true }) {
        nodes { source { nodes { id lang supportsLatest } } }
    } }
`;

const MANGA_QUERY = `
    mutation FetchSourceManga(
        $source: LongString!,
        $page: Int!,
        $type: FetchSourceMangaType!
    ) {
        fetchSourceManga(input: { source: $source, page: $page, type: $type }) {
            hasNextPage
            mangas { id title thumbnailUrl description genre }
        }
    }
`;

export async function getSuwayomiComics(limit = 12): Promise<MediaItem[]> {
    const baseUrl = serverProviderUrl("NEXT_PUBLIC_SUWAYOMI_API_URL", "suwayomi", 4567);
    if (!baseUrl) throw new Error("Suwayomi URL is not configured.");

    const extensions = await graphQl<{ extensions: { nodes: SuwayomiExtension[] } }>(baseUrl, EXTENSIONS_QUERY);
    const sources = extensions.extensions.nodes
        .flatMap((extension) => extension.source.nodes)
        .filter((source) => source.lang === "en")
        .filter((source, index, allSources) =>
            allSources.findIndex((candidate) => candidate.id === source.id) === index,
        );

    const results: MediaItem[] = [];
    let failedSourceRequests = 0;

    for (const source of sources.slice(0, 4)) {
        try {
            const response = await graphQl<{
                fetchSourceManga: { mangas: SuwayomiManga[] } | null;
            }>(
                baseUrl,
                MANGA_QUERY,
                { source: source.id, page: 1, type: source.supportsLatest ? "LATEST" : "POPULAR" },
            );
            results.push(...mapMangaToMediaItems(
                source.id,
                response.fetchSourceManga?.mangas ?? [],
            ));
        } catch {
            // A single unavailable extension must not prevent other installed sources from loading.
            failedSourceRequests += 1;
        }
        if (results.length >= limit) break;
    }
    if (
        sources.length > 0 &&
        failedSourceRequests === Math.min(sources.length, 4) &&
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
            description: manga.description,
            genres: manga.genre,
        }];
    });
}

async function graphQl<T>(
    baseUrl: string,
    query: string,
    variables?: Record<string, string | number>,
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

