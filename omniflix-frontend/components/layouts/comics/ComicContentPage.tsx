"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MediaItem } from "@/lib/media";
import type {
    GenreContentResponse,
    GenreOptionsResponse,
} from "@/lib/genre";
import { useComicsCatalog } from "@/components/layouts/comics/useComicsCatalog";
import { ExploreLayout } from "@/components/layouts/explore/ExploreLayout";
import { PopularContentList } from "@/components/PopularContentList";
import {
    ReadContent,
    ReadContentChapter,
    ReadContentItem,
} from "@/components/ReadContent";
import {
    SuwayomiChapterInfo,
} from "@/service/types/suwayomi.fetch.payload";
import type {
    SuwayomiComicPayload,
} from "@/service/suwayomi/suwayomi.fetch.service";

interface ReadContentProps {
    /** Comic metadata as mapped by `fetchSuwayomiComicPayload`. */
    readonly data: SuwayomiComicPayload["comic"];
    /** Chapters as mapped by `fetchSuwayomiComicPayload`; order is preserved. */
    readonly chapters: readonly SuwayomiChapterInfo[];
    /** Optional origin label, e.g. the Suwayomi source display name. */
    readonly sourceName?: string;
}

const MAX_RECOMMENDATION_GENRES = 2;
/** Popular fallback size; mirrors the sidebar's compact selection. */
const RECOMMENDATION_FALLBACK_LIMIT = 12;

/**
 * Genre options for the comic's own source, served by the existing
 * `/api/explore/genres` route (backed by `getSuwayomiGenreOptions`). Returns
 * `null` while loading or on failure so callers can treat it as "unknown".
 */
async function fetchSuwayomiGenreOptions(
    sourceType: string,
): Promise<GenreOptionsResponse | null> {
    const search = new URLSearchParams({
        provider: "suwayomi",
        mediaType: "comics",
        sourceType,
    });
    const response = await fetch(`/api/explore/genres?${search.toString()}`);
    if (!response.ok) {
        return null;
    }
    return (await response.json()) as GenreOptionsResponse;
}

/** One page of a Suwayomi genre, served by the existing `/api/explore/genre`. */
async function fetchSuwayomiGenrePage(
    sourceType: string,
    genreId: string,
): Promise<MediaItem[]> {
    const search = new URLSearchParams({
        provider: "suwayomi",
        mediaType: "comics",
        sourceType,
        genre: genreId,
        page: "1",
    });
    const response = await fetch(`/api/explore/genre?${search.toString()}`);
    if (!response.ok) {
        throw new Error("The comic genre results are unavailable right now.");
    }
    const payload = (await response.json()) as GenreContentResponse;
    return payload.items;
}

/**
 * Comic details view with source-specific popular sidebar. All comic data
 * arrives already fetched via props. Popular content from the comic's source
 * is fetched via the shared `useComicsCatalog` query hook and rendered in the
 * right sidebar of `ExploreLayout`.
 */
export function ReadContentComic({ data, chapters, sourceName }: ReadContentProps) {

    // Identify source id from the source-aware id (suwayomi:<sourceId>:<comicId>)
    const sourceIdentifier = data.id ? data.id.split(":")[1] ?? null : null;

    // Fetch popular comics for this exact source using the existing Comics catalog query
    const popularCatalogQuery = useComicsCatalog(
        sourceIdentifier,
        1,
        "POPULAR",
        "",
        false,
    );
    const popularItems = popularCatalogQuery.data?.items.slice(0, 12) ?? [];
    const popularError =
        popularCatalogQuery.error instanceof Error
            ? popularCatalogQuery.error.message
            : undefined;

    const sourceHeading = sourceName || "Source";

    // Genre options for the comic's own source. Only resolved once there is a
    // source and the comic carries genre labels to match against.
    const genreOptionsQuery = useQuery({
        queryKey: ["comics", "genre-options", sourceIdentifier],
        queryFn: () => {
            if (!sourceIdentifier) {
                throw new Error("No comic source selected.");
            }
            return fetchSuwayomiGenreOptions(sourceIdentifier);
        },
        enabled: sourceIdentifier !== null && (data.genres?.length ?? 0) > 0,
        staleTime: 5 * 60 * 1000,
    });

    // Genre ids for up to two of the comic's own labels that exist as source
    // filter options. Display labels are never sent to the API — the option
    // id (e.g. `select:3.0:1`) is what the genre route expects.
    const matchedGenreIds = useMemo(() => {
        const options = genreOptionsQuery.data;
        if (!options?.supported) {
            return [];
        }
        const labelToId = new Map(
            options.genres.map((genre) => [genre.label.toLowerCase(), genre.id]),
        );
        return (data.genres ?? [])
            .map((label) => labelToId.get(label.toLowerCase()))
            .filter((genreId): genreId is string => genreId !== undefined)
            .slice(0, MAX_RECOMMENDATION_GENRES);
    }, [genreOptionsQuery.data, data.genres]);

    // One page per matched genre, merged and deduplicated by id.
    const genreRecommendationsQuery = useQuery({
        queryKey: [
            "comics",
            "recommendations",
            sourceIdentifier,
            matchedGenreIds,
        ],
        queryFn: () => {
            if (!sourceIdentifier) {
                throw new Error("No comic source selected.");
            }
            return Promise.all(
                matchedGenreIds.map((genreId) =>
                    fetchSuwayomiGenrePage(sourceIdentifier, genreId),
                ),
            );
        },
        enabled: matchedGenreIds.length > 0 && sourceIdentifier !== null,
        staleTime: 5 * 60 * 1000,
    });

    const genreRecommendations = useMemo(
        () =>
            dedupeRecommendations(
                genreRecommendationsQuery.data?.flat() ?? [],
                data.id,
            ),
        [genreRecommendationsQuery.data, data.id],
    );
    const hasGenreRecommendations = genreRecommendations.length > 0;

    // Genre results are usable only if they still contain another comic after
    // removing duplicates and the current comic. Otherwise reuse the exact
    // source's popular catalog that is already powering the sidebar.
    const recommendations = useMemo(() => {
        if (hasGenreRecommendations) {
            return genreRecommendations;
        }
        if (!sourceIdentifier) {
            return [];
        }
        const sourcePrefix = `suwayomi:${sourceIdentifier}:`;
        const popularItems = (popularCatalogQuery.data?.items ?? [])
            .filter((item) => item.id.startsWith(sourcePrefix))
            .slice(0, RECOMMENDATION_FALLBACK_LIMIT);
        return dedupeRecommendations(popularItems, data.id);
    }, [
        hasGenreRecommendations,
        genreRecommendations,
        popularCatalogQuery.data,
        sourceIdentifier,
        data.id,
    ]);

    const recommendationsLabel = hasGenreRecommendations
        ? "You Might Also Like"
        : `Popular on ${sourceHeading}`;

    return (
        <ExploreLayout
            popular={
                <PopularContentList
                    title={`Popular on ${sourceHeading}`}
                    items={popularItems}
                    error={popularError}
                />
            }
        >
            <ReadContent
                data={toSharedItem(data)}
                chapters={toSharedChapters(chapters)}
                sourceName={sourceName}
                recommendations={recommendations}
                recommendationsLabel={recommendationsLabel}
            />
        </ExploreLayout>
    );
}

/**
 * Merge helper shared with the Novels flow: drops exact-id duplicates and the
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

/** Map a Suwayomi comic into the provider-neutral shape `ReadContent` renders. */
function toSharedItem(data: SuwayomiComicPayload["comic"]): ReadContentItem {
    return {
        id: data.id,
        title: data.title,
        coverImage: data.coverImage,
        description: data.description,
        genres: data.genres,
        status: data.status,
    };
}

function toSharedChapters(
    chapters: readonly SuwayomiChapterInfo[],
): ReadContentChapter[] {
    return chapters.map((chapter) => ({
        id: String(chapter.id),
        title: chapter.name,
        // Kept for the existing search/filter and date display behavior.
        chapterNumber: chapter.chapterNumber,
        uploadDate: chapter.uploadDate,
    }));
}
