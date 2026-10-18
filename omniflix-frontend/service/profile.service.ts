import { NextApiRequest, type ApiResponse } from "./client.service";
import type { MediaItem } from "@/lib/media";
import type {
    EntertainmentListType,
    EntertainmentType,
    ProfileResponse,
    UserEntertainmentItem,
    UserHistoryItem,
    UserSearch,
} from "./types/profile.payload";

export const ENTERTAINMENT_LIST_TYPES: readonly EntertainmentListType[] = [
    "FAVORITE",
    "WATCHLIST",
    "COMPLETED",
    "ON_HOLD",
    "PLAN_TO_WATCH",
    "PLAN_TO_READ",
    "DROPPED",
];

export function getProfile(): Promise<ProfileResponse | null> {
    return getApiData<ProfileResponse | null>("profile");
}

export function getEntertainmentCollection(
    purpose: EntertainmentListType,
): Promise<UserEntertainmentItem[]> {
    return getApiData<UserEntertainmentItem[]>(
        `entertainment?purpose=${encodeURIComponent(purpose)}`,
    );
}

export function getActivityHistory(): Promise<UserHistoryItem[]> {
    return getApiData<UserHistoryItem[]>("history");
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
        });
        grouped[item.purpose][type] = category;
    }

    return grouped;
}

export function mapHistoryToMediaItems(items: UserHistoryItem[]): MediaItem[] {
    return items.map((item) => ({
        id: `${item.apiSource}:${item.externalId}`,
        title: item.externalId,
        type: mediaTypeFromEntertainmentType(item.type),
    }));
}

function mediaTypeFromEntertainmentType(type: EntertainmentType): MediaItem["type"] {
    switch (type) {
        case "COMIC":
        case "MANGA":
        case "MANHWA":
        case "MANHUA":
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
