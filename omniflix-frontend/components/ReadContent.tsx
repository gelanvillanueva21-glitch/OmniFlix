"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ImageIcon } from "@/components/icons/icons";
import { ExploreLayout } from "@/components/layouts/explore/ExploreLayout";
import { PopularContentList } from "@/components/PopularContentList";
import { useComicsCatalog } from "@/components/layouts/comics/useComicsCatalog";
import {
    SuwayomiChapterInfo,
} from "@/service/types/suwayomi.fetch.payload";
import type {
    SuwayomiComicPayload,
} from "@/service/suwayomi.fetch.service";

interface ReadContentProps {
    /** Comic metadata as mapped by `fetchSuwayomiComicPayload`. */
    readonly comic: SuwayomiComicPayload["comic"];
    /** Chapters as mapped by `fetchSuwayomiComicPayload`; order is preserved. */
    readonly chapters: readonly SuwayomiChapterInfo[];
    /** Optional origin label, e.g. the Suwayomi source display name. */
    readonly sourceName?: string;
}

/**
 * Comic details view with source-specific popular sidebar. All comic data
 * arrives already fetched via props. Popular content from the comic's source
 * is fetched via the shared `useComicsCatalog` query hook and rendered in the
 * right sidebar of `ExploreLayout`.
 */
export function ReadContent({ comic, chapters, sourceName }: ReadContentProps) {

    // Identify source id from the source-aware id (suwayomi:<sourceId>:<comicId>)
    const sourceIdentifier = comic.id ? comic.id.split(":")[1] ?? null : null;

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
            <ReadContentHelper 
                comic={comic}
                chapters={chapters}
                sourceName={sourceName}
            />
        </ExploreLayout>
    );
}

/** Suwayomi statuses are UPPER_SNAKE; show them title-cased. */
function formatStatusLabel(status: string): string {
    return status
        .toLowerCase()
        .split(/[_\s]+/)
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
        .join(" ");
}


function ReadContentHelper({ 
    comic, 
    chapters,
    sourceName
}: ReadContentProps) {

    const router = useRouter();
    const [imageFailed, setImageFailed] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [chapterQuery, setChapterQuery] = useState("");

    // Source id from the source-aware id (suwayomi:<sourceId>:<comicId>)
    const sourceIdentifier = comic.id ? comic.id.split(":")[1] ?? null : null;

    const showCover = comic.coverImage !== undefined && !imageFailed;
    const genres = comic.genres ?? [];
    const chapterCount = chapters.length;

    const trimmedQuery = chapterQuery.trim();
    const visibleChapters = trimmedQuery
        ? chapters.filter((chapter) => {
              const name = chapter.name.toLowerCase();
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
        comic.status !== undefined ? formatStatusLabel(comic.status) : null,
    ].filter((part): part is string => part !== null);

    return (
        <article className="readContent">
                <button
                    type="button"
                    aria-label="Go back"
                    className="backButton"
                    onClick={() => {
                        // Return to the source's catalog page the comic was
                        // opened from (e.g. Asura Scans → /explore/comics/<sourceId>).
                        if (sourceIdentifier) {
                            router.push(`/explore/comics/${sourceIdentifier}`);
                        } else {
                            router.push("/explore/comics");
                        }
                    }}
                >
                    <ArrowLeftIcon className="backButtonIcon" />
                </button>
                <div className="detailRow">
                    <div className="coverSection">
                        <div className="coverFrame">
                            {showCover ? (
                                <Image
                                    src={comic.coverImage as string}
                                    alt={`Cover of ${comic.title}`}
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

                        <h2 className="title">{comic.title}</h2>

                        {comic.description !== undefined ? (
                            <p
                                className={`description ${isDescriptionExpanded ? "descriptionExpanded" : ""
                                    }`}
                            >
                                {comic.description}
                            </p>
                        ) : (
                            <p className="descriptionEmpty">No description available.</p>
                        )}

                        {comic.description !== undefined && (
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
                                                {chapter.name}
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
                </div>
            </div>
        </article>
    )
}


/**
 * Renders the chapter upload date deterministically (fixed locale + UTC) so
 * server-rendered HTML always matches the client — `toLocaleDateString()` with
 * the ambient locale/timezone caused hydration mismatches.
 */
function formatChapterDate(uploadDate: SuwayomiChapterInfo["uploadDate"]): string {
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
