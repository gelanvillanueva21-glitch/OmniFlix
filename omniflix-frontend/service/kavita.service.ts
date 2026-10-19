import type { MediaItem } from "@/lib/media";
import {
    configuredEnvironmentValue,
    providerRequest,
    serverProviderUrl,
} from "./provider-client.service";

interface KavitaSeries {
    id?: number;
    name?: string;
    coverImage?: string;
    userRating?: number;
    created?: string;
}

export async function getKavitaSeries(limit = 12): Promise<MediaItem[]> {
    const baseUrl = serverProviderUrl(
        "NEXT_PUBLIC_KAVITA_API_URL", 
        "kavita", 5000
    );
    const apiKey = configuredEnvironmentValue(
        "KAVITA_API_KEY", 
        "NEXT_PUBLIC_KAVITA_KEY"
    );
    if (!baseUrl || !apiKey) {
        throw new Error("Kavita URL or API key is not configured.");
    }

    const response = await providerRequest<KavitaSeries[]>(
        `${baseUrl}/api/Series/recently-added-v2?PageNumber=1&PageSize=${limit}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
            },
            body: JSON.stringify({}),
        },
    );
    return response.flatMap((series) => mapSeriesToMediaItems(series));
}

function mapSeriesToMediaItems(series: KavitaSeries): MediaItem[] {
    if (!series.id || !series.name) {
        return [];
    }

    return [{
        id: `kavita:${series.id}`,
        title: series.name,
        type: "novels",
        coverImage: series.coverImage
            ? `/api/provider-image?provider=kavita&id=${series.id}`
            : undefined,
        rating: validRating(series.userRating),
        releaseYear: getYear(series.created),
    }];
}

function validRating(rating: number | undefined): number | undefined {
    return rating !== undefined 
        && Number.isFinite(rating) 
        && rating > 0 ? 
            rating : undefined;
}

function getYear(date: string | undefined): number | undefined {
    if (!date) return undefined;
    const year = Number(date.slice(0, 4));
    return Number.isInteger(year) ? year : undefined;
}
