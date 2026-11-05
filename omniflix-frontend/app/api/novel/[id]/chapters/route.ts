import { NextResponse } from "next/server";
import { fetchNovelChapterPage } from "@/service/lncrawl/lncrawl.fetch.service";
import type { LncrawlChapterBatchPayload } from "@/service/types/lncrawl.fetch.payload";

const MAX_NOVEL_ID_LENGTH = 200;
const DEFAULT_CHAPTER_LIMIT = 100;
const MAX_CHAPTER_LIMIT = 100;

interface NovelChaptersRouteContext {
    params: Promise<{ id: string }>;
}

export async function GET(
    request: Request,
    { params }: NovelChaptersRouteContext,
) {
    const { id } = await params;
    if (!isValidNovelId(id)) {
        return NextResponse.json(
            { error: "A valid novel id is required." },
            { status: 400 },
        );
    }

    const requestUrl = new URL(request.url);
    const offset = Number(requestUrl.searchParams.get("offset") ?? "0");
    const limit = Number(
        requestUrl.searchParams.get("limit") ?? String(DEFAULT_CHAPTER_LIMIT),
    );
    if (!Number.isSafeInteger(offset) || offset < 0) {
        return NextResponse.json(
            { error: "Offset must be a non-negative integer." },
            { status: 400 },
        );
    }
    if (
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > MAX_CHAPTER_LIMIT
    ) {
        return NextResponse.json(
            { error: `Limit must be an integer between 1 and ${MAX_CHAPTER_LIMIT}.` },
            { status: 400 },
        );
    }

    try {
        const items = await fetchNovelChapterPage(id, offset, limit);
        const response: LncrawlChapterBatchPayload = { items };
        return NextResponse.json(response);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[api/novel/chapters] request failed:", message);
        return NextResponse.json(
            { error: "The novel provider is unavailable right now." },
            { status: 502 },
        );
    }
}

function isValidNovelId(novelId: string): boolean {
    return (
        novelId.length > 0 &&
        novelId.length <= MAX_NOVEL_ID_LENGTH &&
        novelId.trim() === novelId &&
        !novelId.includes("/") &&
        !novelId.includes("\\")
    );
}
