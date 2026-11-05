"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReadContent, ReadContentChapter } from "@/components/ReadContent";
import type { MediaItem } from "@/lib/media";
import type { GenreContentResponse } from "@/lib/genre";
import type {
    LncrawlChapterBatchPayload,
    LncrawlChapterInfo,
    LncrawlNovelDetailPayload,
} from "@/service/types/lncrawl.fetch.payload";
import { DetailSkeleton } from "@/components/loading/ContentDetailLoad";
import { useNovels, usePopularNovels } from "./novelsQueries";
import { ExploreLayout } from "../explore/ExploreLayout";
import { PopularContentList } from "@/components/PopularContentList";

interface NovelContentPageProps {
    /** Raw LNCrawl id. The route page removes the catalog prefix. */
    readonly novelId?: string;
}

const NOVEL_CHAPTER_PAGE_SIZE = 100;
const MAX_RECOMMENDATION_TAGS = 2;
const RECOMMENDATION_FALLBACK_LIMIT = 12;

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

    // The novel detail payload drives the recommendation matching; kept in a
    // variable so hooks below stay unconditional despite the early returns.
    const novelGenres = useMemo(
        () => novelQuery.data?.novel.genres ?? [],
        [novelQuery.data],
    );
    const novelIdForRecommendations = novelQuery.data?.novel.id ?? null;

    // Available LNCrawl tags, served by the existing `/api/explore/genres`.
    // Only resolved when the novel actually carries genre labels to match.
    const genreTagsQuery = useQuery({
        queryKey: ["novels", "genre-tags"],
        queryFn: async () => {
            const response = await fetch("/api/explore/genres?provider=lncrawl&mediaType=novels");
            if (!response.ok) {
                throw new Error("The novel tag list is unavailable right now.");
            }
            return (await response.json()) as { genres: Array<{ id: string; label: string }> };
        },
        enabled: novelGenres.length > 0,
        staleTime: 5 * 60 * 1000,
    });

    // Up to two novel tags that exist in the provider's tag list. Tags are
    // matched case-insensitively by label; the tag id is what the genre route
    // receives — display labels are never sent.
    const matchedTagIds = useMemo(() => {
        const tags = genreTagsQuery.data?.genres;
        if (!tags) {
            return [];
        }
        const labelToId = new Map(
            tags.map((tag) => [tag.label.toLowerCase(), tag.id]),
        );
        return novelGenres
            .map((label) => labelToId.get(label.toLowerCase()))
            .filter((tagId): tagId is string => tagId !== undefined)
            .slice(0, MAX_RECOMMENDATION_TAGS);
    }, [genreTagsQuery.data, novelGenres]);

    // One page per matched tag, fetched through the existing `/api/explore/genre`.
    const genreRecommendationsQuery = useQuery({
        queryKey: ["novels", "recommendations", matchedTagIds],
        queryFn: async () => {
            const pages = await Promise.all(
                matchedTagIds.map(async (tagId) => {
                    const search = new URLSearchParams({
                        provider: "lncrawl",
                        mediaType: "novels",
                        genre: tagId,
                        page: "1",
                    });
                    const response = await fetch(`/api/explore/genre?${search.toString()}`);
                    if (!response.ok) {
                        throw new Error(
                            "The novel tag results are unavailable right now.",
                        );
                    }
                    const payload = (await response.json()) as GenreContentResponse;
                    return payload.items;
                }),
            );
            return pages.flat();
        },
        enabled: matchedTagIds.length > 0,
        staleTime: 5 * 60 * 1000,
    });

    const genreRecommendations = useMemo(() => {
        const currentId = novelIdForRecommendations;
        if (currentId === null) {
            return [];
        }
        return dedupeRecommendations(
            genreRecommendationsQuery.data ?? [],
            currentId,
        );
    }, [genreRecommendationsQuery.data, novelIdForRecommendations]);

    const hasGenreRecommendations = genreRecommendations.length > 0;
    const shouldFetchPopularFallback =
        novelQuery.data !== undefined &&
        (
            novelGenres.length === 0 ||
            (genreTagsQuery.isFetched && matchedTagIds.length === 0) ||
            (
                matchedTagIds.length > 0 &&
                (
                    genreRecommendationsQuery.isError ||
                    (genreRecommendationsQuery.isSuccess && !hasGenreRecommendations)
                )
            )
        );

    // Fetch the popularity-ranked fallback only when tag recommendations
    // cannot provide any usable items. Existing callers keep the default.
    const popularNovelsQuery = usePopularNovels(shouldFetchPopularFallback);

    // Tag recommendations win only when usable items remain after filtering.
    const recommendations = useMemo(() => {
        const currentId = novelIdForRecommendations;
        if (hasGenreRecommendations) {
            return genreRecommendations;
        }
        if (currentId === null || !shouldFetchPopularFallback) {
            return [];
        }
        return dedupeRecommendations(
            (popularNovelsQuery.data ?? []).slice(
                0,
                RECOMMENDATION_FALLBACK_LIMIT,
            ),
            currentId,
        );
    }, [
        genreRecommendations,
        hasGenreRecommendations,
        popularNovelsQuery.data,
        novelIdForRecommendations,
        shouldFetchPopularFallback,
    ]);

    const recommendationsLabel = hasGenreRecommendations
        ? "You Might Also Like"
        : "Popular Novels";

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
                recommendations={recommendations}
                recommendationsLabel={recommendationsLabel}
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

/**
 * Merge helper shared with the Comics flow: drops exact-id duplicates and the
 * currently opened item, so no one recommends itself.
 */
function dedupeRecommendations(
    items: readonly MediaItem[],
    currentId: string,
): MediaItem[] {
    const unique = new Map<string, MediaItem>();
    for (const item of items) {
        if (item.id === currentId || unique.has(item.id)) {
            continue;
        }
        unique.set(item.id, item);
    }
    return [...unique.values()];
}

function NovelDetailError({ message }: { message: string }) {
    return (
        <section className="comic-detail-error">
            <h1>Novel unavailable</h1>
            <p>{message}</p>
        </section>
    );
}
