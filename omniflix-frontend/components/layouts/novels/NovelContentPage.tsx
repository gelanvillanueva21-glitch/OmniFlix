"use client";

import { useQuery } from "@tanstack/react-query";
import { ReadContent, ReadContentChapter } from "@/components/ReadContent";
import type {
    LncrawlChapterBatchPayload,
    LncrawlChapterInfo,
    LncrawlNovelDetailPayload,
} from "@/service/types/lncrawl.fetch.payload";
import { DetailSkeleton } from "@/components/loading/ContentDetailLoad";
import { useNovels } from "./novelsQueries";
import { ExploreLayout } from "../explore/ExploreLayout";
import { PopularContentList } from "@/components/PopularContentList";

interface NovelContentPageProps {
    /** Raw LNCrawl id. The route page removes the catalog prefix. */
    readonly novelId?: string;
}

const NOVEL_CHAPTER_PAGE_SIZE = 100;

/**
 * Initial LNCrawl payload: metadata plus only the FIRST chapter batch. Later
 * batches arrive through the `loadMoreChapters` hook handled by `ReadContent`,
 * so a 2000-chapter novel never downloads 2000 chapters up front.
 */
async function fetchNovelInitialPayload(novelId: string) {
    const [novel, chapters] = await Promise.all([
        fetchNovelDetail(novelId),
        fetchNovelChapterPage(novelId, 0),
    ]);

    return {
        novel: novel.novel,
        chapters: chapters.items,
    };
}

/**
 * Novel details layout. Fetches the LNCrawl metadata + initial chapter batch
 * (100) through TanStack Query and renders it with the shared `ReadContent`
 * component. Chapter reading is intentionally out of scope.
 */
export function NovelContentPage({ novelId }: NovelContentPageProps) {
    const novelQuery = useQuery({
        queryKey: ["novels", "detail", novelId],
        queryFn: () => {
            if (!novelId) {
                throw new Error("No novel selected.");
            }
            return fetchNovelInitialPayload(novelId);
        },
        enabled: Boolean(novelId),
        staleTime: 5 * 60 * 1000,
    });

    const novel = useNovels();
    const popularNovels = novel.data?.pages.flatMap((page) => page.items) ?? [];

    if (!novelId) {
        return <NovelDetailError message="No novel selected." />;
    }

    if (novelQuery.isPending) {
        return <DetailSkeleton />;
    }

    if (novelQuery.isError) {
        return (
            <NovelDetailError
                message={
                    novelQuery.error instanceof Error
                        ? novelQuery.error.message
                        : "Novel details could not be loaded."
                }
            />
        );
    }

    const payload = novelQuery.data;

    return (
        <ExploreLayout
            popular={
                <PopularContentList
                    items={popularNovels}
                    title="Novels"
                />
            }
        >
            <ReadContent
                data={{
                    id: payload.novel.id,
                    title: payload.novel.title,
                    coverImage: payload.novel.coverImage,
                    description: payload.novel.description,
                    genres: payload.novel.genres,
                }}
                chapters={payload.chapters.map(toSharedChapter)}
                loadMoreChapters={(offset) =>
                    fetchNovelChapterPage(novelId, offset).then(
                        (batch) => batch.items.map(toSharedChapter),
                    )
                }
                sourceName="novels"
            />
        </ExploreLayout>
    );
}

async function fetchNovelDetail(
    novelId: string,
): Promise<LncrawlNovelDetailPayload> {
    return fetchNovelApiPayload(
        `/api/novel/${encodeURIComponent(novelId)}`,
    );
}

async function fetchNovelChapterPage(
    novelId: string,
    offset: number,
): Promise<LncrawlChapterBatchPayload> {
    const query = new URLSearchParams({
        offset: String(offset),
        limit: String(NOVEL_CHAPTER_PAGE_SIZE),
    });
    return fetchNovelApiPayload(
        `/api/novel/${encodeURIComponent(novelId)}/chapters?${query.toString()}`,
    );
}

async function fetchNovelApiPayload<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
    });

    let payload: unknown;
    try {
        payload = await response.json();
    } catch {
        throw new Error("The novel API returned an invalid response.");
    }

    if (!response.ok) {
        const message = getNovelApiError(payload);
        throw new Error(message ?? "Novel details could not be loaded.");
    }

    return payload as T;
}

function getNovelApiError(payload: unknown): string | undefined {
    if (
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof payload.error === "string"
    ) {
        return payload.error;
    }
    return undefined;
}

/** Map an LNCrawl chapter into the provider-neutral shape `ReadContent` renders. */
function toSharedChapter(chapter: LncrawlChapterInfo): ReadContentChapter {
    return {
        id: chapter.id,
        title: chapter.title ?? `Chapter ${chapter.serial}`,
        chapterNumber: chapter.serial,
    };
}

function NovelDetailError({ message }: { message: string }) {
    return (
        <section className="comic-detail-error">
            <h1>Novel unavailable</h1>
            <p>{message}</p>
        </section>
    );
}
