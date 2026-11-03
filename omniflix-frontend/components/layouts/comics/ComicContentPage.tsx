"use client";

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
            />
        </ExploreLayout>
    );
}

interface ReadContentProps {
    /** Comic metadata as mapped by `fetchSuwayomiComicPayload`. */
    readonly data: SuwayomiComicPayload["comic"];
    /** Chapters as mapped by `fetchSuwayomiComicPayload`; order is preserved. */
    readonly chapters: readonly SuwayomiChapterInfo[];
    /** Optional origin label, e.g. the Suwayomi source display name. */
    readonly sourceName?: string;
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
