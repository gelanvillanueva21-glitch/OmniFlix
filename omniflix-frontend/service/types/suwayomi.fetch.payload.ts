import type { MediaItem } from "@/lib/media";


export interface SuwayomiComicDetails {
    id: number;
    title: string;
    thumbnailUrl?: string | null;
    description?: string | null;
    genre?: string[] | null;
    status?: string | null;
    author?: string | null;
    artist?: string | null;
    url?: string | null;
    realUrl?: string | null;
    sourceId: string;
    source?: { id: string; name: string } | null;
}


export interface SuwayomiChapter {
    id: number;
    mangaId: number;
    name?: string | null;
    chapterNumber?: number | null;
    scanlator?: string | null;
    uploadDate?: string | null;
}

export interface SuwayomiComicDetailsResult {
    comic: MediaItem & {
        status?: string;
        author?: string;
        artist?: string;
        url?: string;
        realUrl?: string;
    };
    sourceName?: string;
}

export interface SuwayomiChapterInfo {
    id: number;
    mangaId: number;
    name: string;
    chapterNumber?: number;
    scanlator?: string;
    uploadDate?: string;
}

export interface SuwayomiChaptersPage {
    chapters: SuwayomiChapterInfo[];
    hasNextPage: boolean;
}


export interface SuwayomiComicPayload {
    comic: SuwayomiComicDetailsResult["comic"];
    sourceName?: string;
    chapters: SuwayomiChapterInfo[];
}


export interface SuwayomiComicPayloadResponse {
    fetchMangaAndChapters: {
        manga: SuwayomiComicDetails | null;
        chapters: SuwayomiChapter[] | null;
    } | null;
}