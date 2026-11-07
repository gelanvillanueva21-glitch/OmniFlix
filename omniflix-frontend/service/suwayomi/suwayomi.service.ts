import type { Genre, MediaItem } from "@/lib/media";
import { providerRequest, serverProviderUrl } from "../provider-client.service";

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

interface SuwayomiFilter {
    __typename: string;
    name: string;
    values?: string[];
    filters?: SuwayomiFilter[];
}

interface SuwayomiFilterChange {
    position: number;
    checkBoxState?: boolean;
    selectState?: number;
    triState?: "IGNORE" | "INCLUDE" | "EXCLUDE";
    groupChange?: SuwayomiFilterChange;
}

type SuwayomiFilterState =
    | { checkBoxState: boolean }
    | { selectState: number }
    | { triState: "IGNORE" | "INCLUDE" | "EXCLUDE" };

interface SuwayomiGenreOption {
    genre: Genre;
    filterChange: SuwayomiFilterChange;
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
        $query: String,
        $filters: [FilterChangeInput!]
    ) {
        fetchSourceManga(input: {
            source: $source,
            page: $page,
            type: $type,
            query: $query,
            filters: $filters
        }) {
            hasNextPage
            mangas { id title thumbnailUrl description genre }
        }
    }
`;

const SOURCE_FILTERS_QUERY = `
    query SourceFilters($id: LongString!) {
        source(id: $id) {
            filters {
                __typename
                ... on CheckBoxFilter { name }
                ... on SelectFilter { name values }
                ... on TriStateFilter { name }
                ... on GroupFilter {
                    name
                    filters {
                        __typename
                        ... on CheckBoxFilter { name }
                        ... on SelectFilter { name values }
                        ... on TriStateFilter { name }
                        ... on GroupFilter {
                            name
                            filters {
                                __typename
                                ... on CheckBoxFilter { name }
                                ... on SelectFilter { name values }
                                ... on TriStateFilter { name }
                                ... on GroupFilter {
                                    name
                                    filters {
                                        __typename
                                        ... on CheckBoxFilter { name }
                                        ... on SelectFilter { name values }
                                        ... on TriStateFilter { name }
                                        ... on GroupFilter {
                                            name
                                            filters {
                                                __typename
                                                ... on CheckBoxFilter { name }
                                                ... on SelectFilter { name values }
                                                ... on TriStateFilter { name }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
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
        (candidate) => candidate.type === sourceType || candidate.id === sourceType,
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
    filters?: SuwayomiFilterChange[],
): Promise<SuwayomiCatalogPage> {
    const baseUrl = serverProviderUrl("NEXT_PUBLIC_SUWAYOMI_API_URL", "suwayomi", 4567);
    if (!baseUrl) throw new Error("Suwayomi URL is not configured.");
    if (type === "SEARCH" && query === undefined) {
        throw new Error("A query is required for source search.");
    }

    const response = await graphQl<{
        fetchSourceManga: { hasNextPage: boolean; mangas: SuwayomiManga[] } | null;
    }>(
        baseUrl,
        MANGA_QUERY,
        { source: sourceId, page, type, query, filters },
    );

    const catalog = response.fetchSourceManga;
    return {
        items: mapMangaToMediaItems(sourceId, catalog?.mangas ?? []),
        hasNextPage: catalog?.hasNextPage ?? false,
    };
}

export async function getSuwayomiGenreOptions(
    sourceType: string,
): Promise<{ genres: Genre[]; supported: boolean }> {
    const source = await getSuwayomiSource(sourceType);
    const filters = await getSuwayomiSourceFilters(source.id);
    const options = collectAllSuwayomiGenreOptions(filters);
    return {
        genres: options.map((option) => option.genre),
        supported: options.length > 0,
    };
}

export async function fetchSuwayomiGenrePage(
    sourceType: string,
    genreId: string,
    page: number,
): Promise<SuwayomiCatalogPage & { supported: boolean }> {
    const source = await getSuwayomiSource(sourceType);
    const filters = await getSuwayomiSourceFilters(source.id);
    const genreOptions = collectAllSuwayomiGenreOptions(filters);
    const selectedOption = genreOptions.find(
        (option) => option.genre.id === genreId,
    );
    if (genreOptions.length === 0) {
        return { items: [], hasNextPage: false, supported: false };
    }
    if (!selectedOption) {
        throw new Error("The selected genre is not available for this source.");
    }

    const catalog = await fetchSuwayomiCatalogById(
        source.id,
        page,
        "SEARCH",
        "",
        [selectedOption.filterChange],
    );
    return { ...catalog, supported: true };
}

async function getSuwayomiSource(sourceType: string): Promise<SuwayomiSourceInfo> {
    const source = (await getSuwayomiSources()).find(
        (candidate) =>
            candidate.type === sourceType || candidate.id === sourceType,
    );
    if (!source) {
        throw new Error(`Unsupported comic source: ${sourceType}`);
    }
    return source;
}

async function getSuwayomiSourceFilters(
    sourceId: string,
): Promise<SuwayomiFilter[]> {
    const baseUrl = serverProviderUrl("NEXT_PUBLIC_SUWAYOMI_API_URL", "suwayomi", 4567);
    if (!baseUrl) {
        throw new Error("Suwayomi URL is not configured.");
    }
    const response = await graphQl<{
        source: { filters: SuwayomiFilter[] } | null;
    }>(baseUrl, SOURCE_FILTERS_QUERY, { id: sourceId });
    return response.source?.filters ?? [];
}

function collectAllSuwayomiGenreOptions(
    filters: SuwayomiFilter[],
): SuwayomiGenreOption[] {
    const genreGroupIndex = filters.findIndex(
        (filter) =>
            filter.__typename === "GroupFilter" &&
            isGenreFilterName(filter.name),
    );
    if (genreGroupIndex >= 0) {
        return collectSuwayomiGenreOptions(filters[genreGroupIndex], [
            genreGroupIndex,
        ]);
    }

    const directGenreIndex = filters.findIndex(
        (filter) =>
            isGenreFilterName(filter.name) &&
            filter.__typename === "SelectFilter",
    );
    return directGenreIndex >= 0
        ? collectSuwayomiGenreOptions(filters[directGenreIndex], [
            directGenreIndex,
        ])
        : [];
}

function isGenreFilterName(name: string): boolean {
    const normalizedName = name.trim().toLowerCase();
    return normalizedName === "genre" || normalizedName === "genres";
}

function collectSuwayomiGenreOptions(
    filter: SuwayomiFilter,
    positions: number[],
): SuwayomiGenreOption[] {
    if (filter.__typename === "GroupFilter") {
        return (filter.filters ?? []).flatMap((nestedFilter, index) =>
            collectSuwayomiGenreOptions(nestedFilter, [...positions, index]),
        );
    }

    if (filter.__typename === "SelectFilter") {
        return (filter.values ?? []).flatMap((value, index) =>
            value.trim()
                ? [{
                    genre: {
                        id: `select:${positions.join(".")}:${index}`,
                        label: value,
                    },
                    filterChange: buildSuwayomiFilterChange(
                        positions,
                        { selectState: index },
                    ),
                }]
                : [],
        );
    }

    if (filter.__typename === "TriStateFilter") {
        return filter.name.trim()
            ? [{
                genre: {
                    id: `tri:${positions.join(".")}`,
                    label: filter.name,
                },
                filterChange: buildSuwayomiFilterChange(
                    positions,
                    { triState: "INCLUDE" },
                ),
            }]
            : [];
    }

    if (filter.__typename === "CheckBoxFilter") {
        return filter.name.trim()
            ? [{
                genre: {
                    id: `check:${positions.join(".")}`,
                    label: filter.name,
                },
                filterChange: buildSuwayomiFilterChange(
                    positions,
                    { checkBoxState: true },
                ),
            }]
            : [];
    }

    return [];
}

function buildSuwayomiFilterChange(
    positions: number[],
    state: SuwayomiFilterState,
): SuwayomiFilterChange {
    const [position, ...nestedPositions] = positions;
    if (nestedPositions.length === 0) {
        return { position, ...state };
    }

    return {
        position,
        groupChange: buildSuwayomiFilterChange(
            nestedPositions,
            state,
        ),
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
    const { items } = await getSuwayomiComicsPage(limit, 1);
    return items;
}

export interface SuwayomiComicsPage {
    items: MediaItem[];
    hasNextPage: boolean;
}

/**
 * Paged variant for the paginated Discover More route: fetches one page per
 * source (same sources and order as getSuwayomiComics) and reports whether
 * any of them still has more pages.
 */
export async function getSuwayomiComicsPage(
    limit = 12,
    page = 1,
): Promise<SuwayomiComicsPage> {
    const sources = await getSuwayomiSources();
    const englishSources = sources.filter(
        (source) =>
            source.lang === "en" && source.type !== COMICK_SOURCE_TYPE,
    );

    const results: MediaItem[] = [];
    let failedSourceRequests = 0;
    let anySourceHasNextPage = false;

    for (const source of englishSources.slice(0, 4)) {
        try {
            const response = await fetchSuwayomiCatalog(
                source.type,
                page,
                source.supportsLatest ? "LATEST" : "POPULAR",
            );
            results.push(...response.items);
            anySourceHasNextPage = anySourceHasNextPage || response.hasNextPage;
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
    return {
        items: results.slice(0, limit),
        hasNextPage: anySourceHasNextPage,
    };
}

export interface SuwayomiSearchPage {
    items: MediaItem[];
    /** True when every queried source still reports more pages. */
    hasNextPage: boolean;
}

/**
 * Global comic search for the Explore page: one SEARCH page per eligible
 * English source, merged. Sources are identified by `displayName`, which is
 * the canonical identity the codebase already uses (see
 * `sourceTypeFromDisplayName` / `ALLOWED_NON_ENGLISH_SOURCES`); the admin-only
 * "Comick (Unoriginal) (ALL)" source is excluded server-side so its results
 * are never requested nor aggregated. A failing source is skipped so one
 * unavailable extension cannot blank the whole search.
 */
export async function searchSuwayomiComics(
    query: string,
    limit = 8,
    maxSources = 4,
): Promise<SuwayomiSearchPage> {
    const trimmed = query.trim();
    if (!trimmed) return { items: [], hasNextPage: false };

    const sources = (await getSuwayomiSources())
        .filter(
            (source) =>
                source.lang === "en" &&
                // Exclusion uses the canonical type identity (same check as
                // getSuwayomiComicsPage) so the admin-only source is never
                // queried nor aggregated in global search.
                source.type !== COMICK_SOURCE_TYPE,
        )
        .slice(0, maxSources);
    if (sources.length === 0) return { items: [], hasNextPage: false };

    const results = await Promise.allSettled(
        sources.map((source) =>
            fetchSuwayomiCatalog(source.type, 1, "SEARCH", trimmed),
        ),
    );

    const items: MediaItem[] = [];
    let hasNextPage = true;
    for (const result of results) {
        if (result.status === "fulfilled") {
            items.push(...result.value.items);
            hasNextPage = hasNextPage && result.value.hasNextPage;
        }
    }

    return {
        items: items.slice(0, limit),
        hasNextPage,
    };
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
            source: "suwayomi",
            sourceLabel: "Comics",
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
    variables?: Record<string, unknown>,
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
