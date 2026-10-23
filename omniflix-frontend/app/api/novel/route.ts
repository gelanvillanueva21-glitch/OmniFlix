import { NextRequest, NextResponse } from "next/server";
import { getLncrawlNovels } from "@/service/lncrawl.service";
import { uniqueMediaItems } from "@/service/provider-client.service";
import type { MediaItem } from "@/lib/media";

const MAX_LIMIT = 50;

/**
 * Novels API route for the Explore Novels page. Read-only: fetches the
 * LNcrawl catalog via the existing service so the browser never talks to
 * LNcrawl directly or holds its credentials. Descriptions are already
 * normalized to plain text by the service layer.
 *
 * Pagination mirrors the comics catalog contract (`items` + `hasNextPage`)
 * so the shared Load more control works identically.
 */
export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const limitParam = Number(params.get("limit") ?? "12");
    const pageParam = Number(params.get("page") ?? "1");

    try {
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
        if (!Number.isInteger(pageParam) || pageParam < 1) {
            return NextResponse.json(
                { error: "Page must be a positive integer." },
                { status: 400 },
            );
        }

        const offset = (pageParam - 1) * limitParam;
        const { items, total } = await getLncrawlNovels(limitParam, offset);
        const uniqueNovels = uniqueMediaItems(items);

        const response: { items: MediaItem[]; hasNextPage: boolean } = {
            items: uniqueNovels,
            // The offset-based list is exhausted when the server's total count
            // is known; a short page signals the end when it is not.
            hasNextPage:
                total > 0
                    ? offset + items.length < total
                    : items.length === limitParam,
        };
        return NextResponse.json(response);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[api/novel] request failed:", message);
        return NextResponse.json(
            { error: "The novel provider is unavailable right now." },
            { status: 502 },
        );
    }
}
