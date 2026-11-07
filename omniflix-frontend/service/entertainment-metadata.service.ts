import type { MediaItem } from "@/lib/media";
import type {
    UserEntertainmentItem,
} from "./types/profile.payload";
import type { TmdbMovieFetchPayload } from "./types/TmdbFetchPayload";
import type {
    JikanAnimeDetail,
} from "./types/JikanFetchPayload";

/**
 * Resolves raw collection records into real provider metadata.
 *
 * Each record's provider is derived from the identity conventions already
 * used by the existing detail pages (never a bare numeric cast):
 *
 *   comics  -> externalId "suwayomi:<sourceId>:<comicId>"   (Suwayomi)
 *   novels  -> apiSource "lncrawl", externalId = LNcrawl novel id
 *   movies  -> apiSource "tmdb",   externalId = numeric TMDB movie id
 *   series  -> apiSource "tmdb"|"jikan" (matched case-insensitively, matching
 *              SeriesReadContent), externalId = numeric provider id
 *
 * Every fetch goes through the provider's EXISTING service/route; nothing
 * provider-specific is re-implemented here. Failures throw — callers decide
 * how a failed item is presented, and fabricated metadata never leaves this
 * module.
 */

const TMDB_SERIES_PREFIX = "tmdb:series:";

/**
 * Builds the cache/query identity for one record. Includes apiSource on
 * purpose: two providers can share the same externalId, so identity is the
 * full (purpose-independent) tuple, not just the external id.
 */
export function entertainmentIdentityKey(item: UserEntertainmentItem): string {
    return `${item.entertainmentType}|${item.apiSource}|${item.externalId}`;
}

/** Fetches + maps one record into a MediaItem, preserving provider identity. */
export async function fetchEntertainmentMetadata(
    item: UserEntertainmentItem,
): Promise<MediaItem> {
    switch (item.entertainmentType) {
        case "COMIC":
            return fetchComicMetadata(item);
        case "NOVEL":
            return fetchNovelMetadata(item);
        case "MOVIE":
            return fetchMovieMetadata(item);
        case "SERIES":
            return fetchSeriesMetadata(item);
    }
}

// ── Comics (Suwayomi) ────────────────────────────────────────────────────

async function fetchComicMetadata(
    item: UserEntertainmentItem,
): Promise<MediaItem> {
    const { sourceId, comicId } = parseSuwayomiExternalId(item.externalId);
    const response = await fetch(`/api/comics/${sourceId}/${comicId}`);
    if (!response.ok) {
        throw new Error(
            `Comic ${item.externalId} could not be loaded (status ${response.status}).`,
        );
    }
    const payload = (await response.json()) as {
        comic: {
            id: string;
            title: string;
            coverImage?: string;
            description?: string;
            genres?: string[];
        };
        sourceName?: string;
    };
    return {
        id: payload.comic.id,
        title: payload.comic.title,
        type: "comics",
        source: "suwayomi",
        sourceLabel: payload.sourceName ?? "Comics",
        coverImage: payload.comic.coverImage,
        description: payload.comic.description,
        genres: payload.comic.genres,
    };
}

/**
 * The stored comics externalId is the mediaHref-compatible source-aware id.
 * The source identifier stays a string (Suwayomi LongString ids exceed
 * Number.MAX_SAFE_INTEGER — same rule as `mediaHref`).
 */
function parseSuwayomiExternalId(externalId: string): {
    sourceId: string;
    comicId: string;
} {
    const parts = externalId.split(":");
    if (
        parts.length !== 3 ||
        parts[0] !== "suwayomi" ||
        !/^\d+$/.test(parts[1]) ||
        !/^\d+$/.test(parts[2])
    ) {
        throw new Error(`Invalid comic identity: ${externalId}`);
    }
    return { sourceId: parts[1], comicId: parts[2] };
}

// ── Novels (LNcrawl) ─────────────────────────────────────────────────────

async function fetchNovelMetadata(
    item: UserEntertainmentItem,
): Promise<MediaItem> {
    // The novel route accepts any non-empty id; identifiers stay strings.
    const response = await fetch(
        `/api/novel/${encodeURIComponent(item.externalId)}`,
        { headers: { Accept: "application/json" } },
    );
    if (!response.ok) {
        throw new Error(
            `Novel ${item.externalId} could not be loaded (status ${response.status}).`,
        );
    }
    const payload = (await response.json()) as {
        novel: {
            id: string;
            title: string;
            coverImage?: string;
            description?: string;
            genres: string[];
        };
    };
    return {
        id: `lncrawl:${payload.novel.id}`,
        title: payload.novel.title,
        type: "novels",
        source: "lncrawl",
        sourceLabel: "LNcrawl",
        coverImage: payload.novel.coverImage,
        description: payload.novel.description,
        genres: payload.novel.genres,
    };
}

// ── Movies (TMDB) ────────────────────────────────────────────────────────

async function fetchMovieMetadata(
    item: UserEntertainmentItem,
): Promise<MediaItem> {
    if (!/^[1-9]\d*$/.test(item.externalId)) {
        throw new Error(`Invalid TMDB movie id: ${item.externalId}`);
    }
    const response = await fetch(
        `/api/tmdb/movie/${encodeURIComponent(item.externalId)}`,
        { headers: { Accept: "application/json" } },
    );
    if (!response.ok) {
        throw new Error(
            `Movie ${item.externalId} could not be loaded (status ${response.status}).`,
        );
    }
    const payload = (await response.json()) as TmdbMovieFetchPayload;
    return mapTmdbMovieToMediaItem(payload);
}

function mapTmdbMovieToMediaItem(
    payload: TmdbMovieFetchPayload,
): MediaItem {
    return {
        id: `tmdb:movies:${payload.id}`,
        title: payload.title ?? payload.originalTitle ?? "Untitled movie",
        type: "movies",
        source: "tmdb",
        sourceLabel: "TMDB",
        coverImage: payload.posterImage,
        description: payload.overview,
        genres: payload.genres.length ? payload.genres : undefined,
        rating: payload.rating,
        releaseYear: payload.releaseYear,
    };
}

// ── Series (TMDB / Jikan) ────────────────────────────────────────────────

async function fetchSeriesMetadata(
    item: UserEntertainmentItem,
): Promise<MediaItem> {
    const provider = item.apiSource.toLowerCase();
    if (provider === "tmdb") {
        if (!/^[1-9]\d*$/.test(item.externalId)) {
            throw new Error(`Invalid TMDB series id: ${item.externalId}`);
        }
        const response = await fetch(
            `/api/tmdb/series/${encodeURIComponent(item.externalId)}`,
            { headers: { Accept: "application/json" } },
        );
        if (!response.ok) {
            throw new Error(
                `Series ${item.externalId} could not be loaded (status ${response.status}).`,
            );
        }
        const payload = (await response.json()) as {
            series: {
                id?: number;
                name?: string;
                original_name?: string;
                overview?: string | null;
                poster_path?: string | null;
                vote_average?: number | null;
                first_air_date?: string | null;
                genres?: Array<{ name?: string }>;
            };
        };
        return mapTmdbSeriesToMediaItem(payload.series, item.externalId);
    }

    if (provider === "jikan" || provider === "anime") {
        if (!/^[1-9]\d*$/.test(item.externalId)) {
            throw new Error(`Invalid MAL anime id: ${item.externalId}`);
        }
        // Full episode walk (fetchAnimeDataPayload) is unnecessary for a
        // metadata card; the anime detail endpoint alone is used.
        const response = await fetch(
            `/api/jikan/anime/${encodeURIComponent(item.externalId)}`,
            { headers: { Accept: "application/json" } },
        );
        if (!response.ok) {
            throw new Error(
                `Anime ${item.externalId} could not be loaded (status ${response.status}).`,
            );
        }
        const payload = (await response.json()) as { anime: JikanAnimeDetail };
        return mapJikanAnimeToMediaItem(payload.anime, item.externalId);
    }

    throw new Error(`Unsupported series provider: ${item.apiSource}`);
}

function mapTmdbSeriesToMediaItem(
    series: {
        id?: number;
        name?: string;
        original_name?: string;
        overview?: string | null;
        poster_path?: string | null;
        vote_average?: number | null;
        first_air_date?: string | null;
        genres?: Array<{ name?: string }>;
    },
    providerId: string,
): MediaItem {
    const genres = (series.genres ?? [])
        .map((genre) => genre.name)
        .filter((name): name is string => Boolean(name));
    const rating =
        typeof series.vote_average === "number" && series.vote_average > 0
            ? series.vote_average
            : undefined;
    return {
        id: `${TMDB_SERIES_PREFIX}${series.id ?? providerId}`,
        title: series.name ?? series.original_name ?? "Untitled series",
        type: "series",
        source: "tmdb",
        sourceLabel: "TMDB",
        coverImage: series.poster_path
            ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
            : undefined,
        description: series.overview ?? undefined,
        genres: genres.length ? genres : undefined,
        rating,
        releaseYear: getYear(series.first_air_date ?? undefined),
    };
}

function mapJikanAnimeToMediaItem(
    anime: JikanAnimeDetail,
    providerId: string,
): MediaItem {
    const genres = [...(anime.genres ?? []), ...(anime.themes ?? [])]
        .map((entry) => entry.name)
        .filter((name): name is string => Boolean(name));
    const rating =
        typeof anime.score === "number" && anime.score > 0
            ? anime.score
            : undefined;
    return {
        id: `jikan:${anime.malId ?? providerId}`,
        title: anime.title ?? anime.titleEnglish ?? "Untitled anime",
        type: "series",
        source: "jikan",
        sourceLabel: "Anime",
        coverImage:
            anime.images?.large || anime.images?.medium || anime.imageUrl ||
            undefined,
        description: anime.synopsis ?? undefined,
        genres: genres.length ? genres : undefined,
        rating,
        releaseYear: anime.year ?? getYear(anime.aired?.from ?? undefined),
    };
}

function getYear(date: string | undefined): number | undefined {
    if (!date) return undefined;
    const year = Number(date.slice(0, 4));
    return Number.isInteger(year) && year > 0 ? year : undefined;
}

/** Unused type re-export kept minimal: categories come from EntertainmentType. */
