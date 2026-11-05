import { NextResponse } from "next/server";
import { getPopularLncrawlNovels } from "@/service/lncrawl/lncrawl.service";
import { uniqueMediaItems } from "@/service/provider-client.service";
import type { MediaItem } from "@/lib/media";

/**
 * Popular novels API route for the Explore sidebar. Read-only: fetches
 * popularity-ranked novels from the LNcrawl server via the existing service
 * so the browser never talks to LNcrawl or holds its credentials.
 */
export async function GET() {
    try {
        const novels = await getPopularLncrawlNovels();
        const uniqueNovels = uniqueMediaItems(novels).slice(0, 10);
        const response: { novels: MediaItem[] } = { novels: uniqueNovels };
        return NextResponse.json(response);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[api/novel/popular] request failed:", message);
        return NextResponse.json(
            { error: "The novel provider is unavailable right now." },
            { status: 502 },
        );
    }
}
