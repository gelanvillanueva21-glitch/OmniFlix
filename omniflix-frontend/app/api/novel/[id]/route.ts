import { NextResponse } from "next/server";
import { htmlToText } from "@/lib/html";
import { fetchNovelDataPayload } from "@/service/lncrawl.fetch.service";
import type { LncrawlNovelDetailPayload } from "@/service/types/lncrawl.fetch.payload";

const MAX_NOVEL_ID_LENGTH = 200;

interface NovelRouteContext {
    params: Promise<{ id: string }>;
}

export async function GET(
    _request: Request,
    { params }: NovelRouteContext,
) {
    const { id } = await params;
    if (!isValidNovelId(id)) {
        return NextResponse.json(
            { error: "A valid novel id is required." },
            { status: 400 },
        );
    }

    try {
        const detail = await fetchNovelDataPayload(id);
        if (
            typeof detail.id !== "string" ||
            typeof detail.title !== "string" ||
            !detail.title.trim()
        ) {
            throw new Error("LNCrawl novel detail response is missing required fields.");
        }

        const response: LncrawlNovelDetailPayload = {
            novel: {
                id: detail.id,
                title: detail.title,
                coverImage: detail.cover_url || undefined,
                description: htmlToText(detail.synopsis) || undefined,
                genres: Array.isArray(detail.tags) ? detail.tags : [],
                authors: detail.authors,
                url: detail.url,
                chapterCount: detail.chapter_count,
                volumeCount: detail.volume_count,
                domain: detail.domain,
            },
        };
        return NextResponse.json(response);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[api/novel/detail] request failed:", message);
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
