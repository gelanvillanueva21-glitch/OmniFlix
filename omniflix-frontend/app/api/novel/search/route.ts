import { NextRequest, NextResponse } from "next/server";
import { searchLncrawlNovels } from "@/service/lncrawl.service";
import { uniqueMediaItems } from "@/service/provider-client.service";
import type { MediaItem } from "@/lib/media";

const MAX_LIMIT = 50;

/**
 * Novel search API route for the Explore Novels page. Read-only: forwards the
 * query to LNcrawl's `/api/novels?search=` endpoint via the existing service
 * so the browser never talks to LNcrawl directly or holds its credentials.
 *
 * LNcrawl's search covers every source currently indexed on the server, so
 * sources added to the LNcrawl instance are searchable with no frontend
 * changes. Pagination mirrors the comics search contract (`items` only; the
 * UI passes `hasNextPage: false` since the service returns a single page).
 */
export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const query = params.get("query") ?? "";
    const limitParam = Number(params.get("limit") ?? "20");

    if (!query.trim()) {
        return NextResponse.json({ items: [] });
    }
    if (
        !Number.isInteger(limitParam) ||
        limitParam < 1 ||
        limitParam > MAX_LIMIT
    ) {
        return NextResponse.json(
            { error: `Limit must be an integer between 1 and ${MAX_LIMIT}.` },
            { status: 400 },
        );
    }

    try {
        const items = await searchLncrawlNovels(query, limitParam);
        const response: { items: MediaItem[] } = {
            items: uniqueMediaItems(items),
        };
        return NextResponse.json(response);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[api/novel/search] request failed:", message);
        return NextResponse.json(
            { error: "The novel provider is unavailable right now." },
            { status: 502 },
        );
    }
}
