"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ImageIcon } from "@/components/icons/icons";

/**
 * Provider-neutral detail item. Comics map their `SuwayomiComicPayload`
 * payload into this shape; Novels map the LNCrawl payload the same way, so
 * the renderer never needs provider-specific conditions.
 */
export interface ReadContentItem {
    /** Provider-aware id. Comics: `suwayomi:<sourceId>:<comicId>`. Novels: LNCrawl uuid. */
    id: string;
    title: string;
    coverImage?: string;
    description?: string;
    genres?: string[];
    /** UPPER_SNAKE provider status; rendered title-cased when present. */
    status?: string;
}

/** Provider-neutral chapter. Order is preserved as delivered by the service. */
export interface ReadContentChapter {
    id: string;
    title: string;
    chapterNumber?: number;
    uploadDate?: string;
}

export interface ReadContentProps {
    readonly data: ReadContentItem;
    readonly chapters: readonly ReadContentChapter[];
    readonly sourceName?: string;
    /**
     * Novel-only hook for the Load More Chapters button: fetches the next
     * LNCrawl chapter page at the given offset and returns the mapped
     * provider-neutral chapters for that batch. Omitted for comics, which
     * always receive their complete chapter list up front.
     */
    readonly loadMoreChapters?: (
        offset: number,
    ) => Promise<readonly ReadContentChapter[]>;
}

/** Provider-specific values `ReadContent` needs to render one detail view. */
interface ReadContentUi {
    /** Suwayomi source id, or null for non-Suwayomi ids (e.g. novel uuids). */
    readonly sourceIdentifier: string | null;
    readonly showCover: boolean;
    readonly genres: string[];
    readonly chapterCount: number;
    readonly visibleChapters: readonly ReadContentChapter[];
    readonly metadataParts: string[];
    /** Catalog page the back button returns to. */
    readonly backHref: string;
}

/**
 * Prepares the provider-specific UI values for the shared renderer.
 *
 * Comics (Suwayomi): the id is `suwayomi:<sourceId>:<comicId>`, so the source
 * id is extracted for back navigation to the comic's source page. Status is a
 * provider status and is title-cased for display.
 *
 * Novels (LNCrawl): the id is a plain uuid — no source id is extracted, and
 * the back target is `/explore/novels`. LNCrawl exposes no publication status,
 * so only the origin label is shown; optional metadata (cover, description,
 * tags) is handled as present-or-absent without inventing values.
 */
function deriveReadContentUi(
    data: ReadContentItem,
    chapters: readonly ReadContentChapter[],
    sourceName: string | undefined,
    imageFailed: boolean,
    chapterQuery: string,
): ReadContentUi {
    const sourceIdentifier = data.id.startsWith("suwayomi:")
        ? data.id.split(":")[1] ?? null
        : null;

    const trimmedQuery = chapterQuery.trim();
    const visibleChapters = trimmedQuery
        ? chapters.filter((chapter) => {
            const name = chapter.title.toLowerCase();
            const number =
                chapter.chapterNumber !== undefined
                    ? String(chapter.chapterNumber)
                    : "";
            return (
                name.includes(trimmedQuery.toLowerCase()) ||
                number.includes(trimmedQuery)
            );
        })
        : chapters;

    const metadataParts = [
        sourceName,
        data.status !== undefined ? formatStatusLabel(data.status) : null,
    ].filter((part): part is string => part !== null);

    return {
        sourceIdentifier,
        showCover: data.coverImage !== undefined && !imageFailed,
        genres: data.genres ?? [],
        chapterCount: chapters.length,
        visibleChapters,
        metadataParts,
        backHref: sourceIdentifier
            ? `/explore/comics/${sourceIdentifier}`
            : sourceName === "novels"
                ? "/explore/novels"
                : "/explore/comics",
    };
}

/** LNCrawl chapter page size; a full batch hints that more pages may exist. */
const NOVEL_CHAPTER_BATCH_SIZE = 100;

/** Shared details view used by both the Comics and Novels layout components. */
export function ReadContent({
    data,
    chapters,
    sourceName,
    loadMoreChapters,
}: ReadContentProps) {

    const router = useRouter();
    const [imageFailed, setImageFailed] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [chapterQuery, setChapterQuery] = useState("");

    // Novel Load More state. Comics never pass `loadMoreChapters`, so this
    // stays inert for them.
    const [additionalChapters, setAdditionalChapters] = useState<
        readonly ReadContentChapter[]
    >([]);
    const [isLoadingMoreChapters, setIsLoadingMoreChapters] = useState(false);
    const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
    // Size of the most recently loaded batch (the initial batch is the props
    // list). Exactly 100 ⇒ another batch may exist; fewer ⇒ end of the list.
    const [lastBatchSize, setLastBatchSize] = useState(chapters.length);
    // Offsets already requested successfully/in-flight, so the same page is
    // never fetched twice; cleared on error so the user can retry that page.
    const requestedOffsetsRef = useRef<Set<number>>(new Set());

    // Chapters already loaded for novels = initial batch + appended batches.
    // Duplicates are filtered out when a batch is appended (see handleLoadMore).
    const allChapters =
        additionalChapters.length > 0
            ? [...chapters, ...additionalChapters]
            : chapters;

    const ui = deriveReadContentUi(
        data,
        allChapters,
        sourceName,
        imageFailed,
        chapterQuery,
    );

    const {
        showCover,
        genres,
        chapterCount,
        visibleChapters,
        metadataParts,
        backHref,
    } = ui;

    const isNovel = sourceName === "novels";
    const canLoadMoreChapters =
        isNovel &&
        loadMoreChapters !== undefined &&
        lastBatchSize === NOVEL_CHAPTER_BATCH_SIZE;

    async function handleLoadMoreChapters(): Promise<void> {
        if (loadMoreChapters === undefined || isLoadingMoreChapters) {
            return;
        }
        // The next LNCrawl page starts right after the chapters already shown.
        const offset = allChapters.length;
        if (requestedOffsetsRef.current.has(offset)) {
            return;
        }
        requestedOffsetsRef.current.add(offset);
        setIsLoadingMoreChapters(true);
        setLoadMoreError(null);
        try {
            const batch = await loadMoreChapters(offset);
            // Append only chapters not already shown, keeping list order.
            setAdditionalChapters((loaded) => {
                const seen = new Set(
                    [...chapters, ...loaded].map((chapter) => chapter.id),
                );
                const fresh = batch.filter((chapter) => !seen.has(chapter.id));
                for (const chapter of fresh) {
                    seen.add(chapter.id);
                }
                return [...loaded, ...fresh];
            });
            setLastBatchSize(batch.length);
        } catch (error) {
            // Allow retrying this offset later.
            requestedOffsetsRef.current.delete(offset);
            setLoadMoreError(
                error instanceof Error
                    ? error.message
                    : "Failed to load more chapters.",
            );
        } finally {
            setIsLoadingMoreChapters(false);
        }
    }

    return (
        <article className="readContent">
            <button
                type="button"
                aria-label="Go back"
                className="backButton"
                onClick={() => {
                    // Return to the provider catalog page the item was
                    // opened from (e.g. Asura Scans → /explore/comics/<sourceId>,
                    // novels → /explore/novels).
                    router.push(backHref);
                }}
            >
                <ArrowLeftIcon className="backButtonIcon" />
            </button>
            <div className="detailRow">
                <div className="coverSection">
                    <div className="coverFrame">
                        {showCover ? (
                            <Image
                                src={data.coverImage as string}
                                alt={`Cover of ${data.title}`}
                                fill
                                sizes="(max-width: 768px) 40vw, 260px"
                                className="coverImage"
                                onError={() => setImageFailed(true)}
                            />
                        ) : (
                            <div className="coverPlaceholder">
                                <ImageIcon className="coverPlaceholderIcon" />
                            </div>
                        )}
                    </div>
                    {genres.length > 0 && (
                        <ul className="genreList" aria-label="Genres">
                            {genres.map((genre) => (
                                <li key={genre} className="genreTag">
                                    {genre}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="detailsSection">
                    <p className="metadataLine">
                        {metadataParts.map((part, index) => (
                            <span
                                key={`${part}-${index}`}
                                className="metadataPart">
                                {part}
                            </span>
                        ))}
                    </p>

                    <h2 className="title">{data.title}</h2>

                    {data.description !== undefined ? (
                        <p
                            className={`description ${isDescriptionExpanded ? "descriptionExpanded" : ""
                                }`}
                        >
                            {data.description}
                        </p>
                    ) : (
                        <p className="descriptionEmpty">No description available.</p>
                    )}

                    {data.description !== undefined && (
                        <button
                            type="button"
                            className="descriptionToggle"
                            onClick={() => setIsDescriptionExpanded((expanded) => !expanded)}
                        >
                            {isDescriptionExpanded ? "Show less" : "Show more"}
                        </button>
                    )}

                    <div className="actionRow">
                        <button
                            type="button"
                            disabled
                            className="actionButton primaryButton"
                        >
                            Read Chapter 1
                        </button>
                        <button
                            type="button"
                            disabled
                            className="actionButton secondaryButton"
                        >
                            Bookmark
                        </button>
                    </div>

                    <div className="chaptersHeader">
                        <input
                            type="search"
                            className="chapterSearch"
                            placeholder="Search chapters"
                            aria-label="Search chapters"
                            value={chapterQuery}
                            onChange={(event) => setChapterQuery(event.target.value)}
                        />
                        <span className="chaptersCount">
                            {chapterCount} {chapterCount === 1 ? "chapter" : "chapters"}
                        </span>
                    </div>

                    {chapters.length > 0 ? (
                        visibleChapters.length > 0 ? (
                            <ol className="chapterList">
                                {visibleChapters.map((chapter) => (
                                    <li key={chapter.id} className="chapterRow">
                                        <span className="chapterName">
                                            {chapter.title}
                                        </span>
                                        <span className="chapterMeta">
                                            {formatChapterDate(chapter.uploadDate)}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="chaptersEmpty">No chapters match your search.</p>
                        )
                    ) : (
                        <p className="chaptersEmpty">No chapters available yet
                        </p>
                    )}

                    {canLoadMoreChapters && (
                        <div className="loadMoreArea">
                            {loadMoreError !== null && (
                                <p className="loadMoreError" role="alert">
                                    {loadMoreError}
                                </p>
                            )}
                            <button
                                type="button"
                                className="loadMoreButton"
                                disabled={isLoadingMoreChapters}
                                onClick={handleLoadMoreChapters}
                            >
                                {isLoadingMoreChapters
                                    ? "Loading chapters…"
                                    : "Load More Chapters"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </article>
    )
}


/**
 * Renders the chapter upload date deterministically (fixed locale + UTC) so
 * server-rendered HTML always matches the client — `toLocaleDateString()` with
 * the ambient locale/timezone caused hydration mismatches. LNCrawl chapters
 * carry no upload date and render no meta text.
 */
function formatChapterDate(uploadDate: string | undefined): string {
    if (uploadDate === undefined) {
        return "";
    }
    const date = new Date(Number(uploadDate));
    if (Number.isNaN(date.getTime())) {
        return "";
    }
    return new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "numeric",
        day: "numeric",
    }).format(date);
}


/** Suwayomi statuses are UPPER_SNAKE; show them title-cased. */
function formatStatusLabel(status: string): string {
    return status
        .toLowerCase()
        .split(/[_\s]+/)
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
        .join(" ");
}
