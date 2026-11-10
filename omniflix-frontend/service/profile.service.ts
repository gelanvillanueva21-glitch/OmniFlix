import { NextApiRequest, type ApiResponse } from "./client.service";
import { mediaTypeLabel, type MediaItem } from "@/lib/media";
import type {
    EntertainmentListType,
    EntertainmentType,
    ProfileResponse,
    UserEntertainmentItem,
    UserHistoryItem,
    UserSearch,
} from "./types/profile.payload";
import { fetchEntertainmentMetadata } from "./entertainment-metadata.service";

export const ENTERTAINMENT_LIST_TYPES: readonly EntertainmentListType[] = [
    "FAVORITE",
    "WATCHLIST",
    "READLIST",
    "COMPLETED",
    "ON_HOLD",
    "DROPPED",
];

export function getEntertainmentCollection(
    purpose: EntertainmentListType,
): Promise<UserEntertainmentItem[]> {
    return getApiData<UserEntertainmentItem[]>(
        `entertainment?purpose=${encodeURIComponent(purpose)}`,
    );
}

/**
 * Saves one entertainment item into one of the profile's collections via the
 * Next.js /api/entertainment route (POST). The backend stores only the
 * identity tuple (externalId, apiSource) plus purpose/type, so the record can
 * be re-fetched from its provider later.
 */
export function saveEntertainment(payload: {
    externalId: string;
    apiSource: string;
    purpose: EntertainmentListType;
    entertainmentType: EntertainmentType;
}): Promise<UserEntertainmentItem> {
    return NextApiRequest<ApiResponse<UserEntertainmentItem>>("entertainment", {
        method: "POST",
        body: JSON.stringify(payload),
    }).then((response) => response.data);
}

/**
 * Deletes one stored collection row via the Next.js /api/entertainment route
 * (DELETE). The route matches on (id, profileId, purpose), so both the row id
 * and the owning purpose must be supplied.
 */
export function deleteEntertainment(payload: {
    id: number;
    purpose: EntertainmentListType;
}): Promise<void> {
    return NextApiRequest<ApiResponse<unknown>>("entertainment", {
        method: "DELETE",
        body: JSON.stringify(payload),
    }).then(() => undefined);
}

export function getActivityHistory(): Promise<UserHistoryItem[]> {
    return getApiData<UserHistoryItem[]>("history");
}

/**
 * Records one browsing activity for the authenticated profile via the
 * Next.js history API route. Fire-and-forget from the caller's perspective —
 * the returned promise may be ignored (or caught) since a failed write must
 * never block navigation.
 */
export function saveActivityHistory(payload: {
    externalId: string;
    apiSource: string;
    type: EntertainmentType;
}): Promise<UserHistoryItem> {
    return NextApiRequest<ApiResponse<UserHistoryItem>>("history", {
        method: "POST",
        body: JSON.stringify(payload),
    }).then((response) => response.data);
}

/**
 * Deletes every recorded activity of the authenticated profile via the
 * Next.js history API route (DELETE handler).
 */
export function clearActivityHistory(): Promise<number> {
    return NextApiRequest<ApiResponse<{ deletedCount: number }>>("history", {
        method: "DELETE",
    }).then((response) => response.data.deletedCount);
}

export function getSearchHistory(): Promise<UserSearch[]> {
    return getApiData<UserSearch[]>("search/history");
}

export function groupEntertainmentItems(
    items: UserEntertainmentItem[],
): Record<
    EntertainmentListType,
    Partial<Record<MediaItem["type"], MediaItem[]>>
> {
    const grouped = Object.fromEntries(
        ENTERTAINMENT_LIST_TYPES.map((purpose) => [purpose, {}]),
    ) as Record<
        EntertainmentListType,
        Partial<Record<MediaItem["type"], MediaItem[]>>
    >;

    for (const item of items) {
        const type = mediaTypeFromEntertainmentType(item.entertainmentType);
        const category = grouped[item.purpose][type] ?? [];
        category.push({
            id: `${item.apiSource}:${item.externalId}`,
            title: item.externalId,
            type,
            source: item.apiSource,
            sourceLabel: mediaTypeLabel(type),
        });
        grouped[item.purpose][type] = category;
    }

    return grouped;
}

/**
 * Resolves every server-side history entry into a fully-populated MediaItem
 * by reusing the same provider fetcher the collection and guest read paths
 * use. Entries are fetched with `Promise.allSettled` so one dead id (deleted
 * comic, stale provider id) is dropped instead of failing the whole history.
 * Results stay in the API's newest-first order.
 */
export async function mapHistoryToMediaItems(
    items: UserHistoryItem[],
): Promise<MediaItem[]> {
    if (items.length === 0) return [];

    const settled = await Promise.allSettled(
        items.map(async (item) => {
            const externalId = regexCheck(item);
            const media = await fetchEntertainmentMetadata({
                id: item.id,
                profileId: 0,
                externalId,
                apiSource: item.apiSource,
                // `purpose` is unused by fetchEntertainmentMetadata; FAVORITE
                // satisfies the record shape without implying a collection.
                purpose: "FAVORITE",
                entertainmentType: item.type,
                createdAt: item.createdAt,
            });
            return { media, createdAt: item.createdAt };
        }),
    );

    const resolved: { media: MediaItem; createdAt: string }[] = [];
    for (const result of settled) {
        if (result.status === "fulfilled") {
            resolved.push(result.value);
        } else {
            // One dead entry must not blank the whole history — drop it quietly.
            console.error("History entry could not be loaded", result.reason);
        }
    }

    resolved.sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );

    return resolved.map((item) => item.media);
}


function regexCheck(item: UserHistoryItem): string {
    let externalId = item.externalId;
    switch (item.type) {
        case "NOVEL":
            if (externalId.startsWith("lncrawl:")) {
                externalId = externalId.slice("lncrawl:".length);
            }
            break;
        case "MOVIE":
            if (externalId.startsWith("tmdb:movies:")) {
                externalId = externalId.slice("tmdb:movies:".length);
            } else if (externalId.startsWith("tmdb-")) {
                externalId = externalId.slice("tmdb-".length);
            }
            break;
        case "SERIES":
            if (externalId.startsWith("jikan:")) {
                externalId = externalId.slice("jikan:".length);
            } else if (externalId.startsWith("tmdb:series:")) {
                externalId = externalId.slice("tmdb:series:".length);
            }
            break;
        }
    return externalId;
}

function mediaTypeFromEntertainmentType(type: EntertainmentType): MediaItem["type"] {
    switch (type) {
        case "COMIC":
            return "comics";
        case "NOVEL":
            return "novels";
        case "MOVIE":
            return "movies";
        case "SERIES":
            return "series";
    }
}

async function getApiData<T>(path: string): Promise<T> {
    const response = await NextApiRequest<ApiResponse<T>>(path);
    return response.data;
}
