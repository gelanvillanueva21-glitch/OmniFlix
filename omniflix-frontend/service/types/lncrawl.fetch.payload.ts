/**
 * LNCrawl novel-detail payload types, modeled on the verified server API:
 *
 *   GET /api/novel/{novel_id}                      → LncrawlNovelDetail
 *   GET /api/novel/{novel_id}/chapters?offset&limit → LncrawlChaptersPage
 */

/** Novel metadata as returned by GET /api/novel/{novel_id}. */
export interface LncrawlNovelDetail {
  id: string;
  url?: string;
  title: string;
  /** HTML synopsis — normalize with `htmlToText` before rendering. */
  synopsis?: string;
  cover_url?: string;
  language?: string;
  chapter_count?: number;
  domain?: string;
  authors?: string;
  tags?: string[];
  volume_count?: number;
  popularity?: number;
}

/** One chapter item as returned by the chapter-list endpoint. */
export interface LncrawlChapterInfo {
  id: string;
  serial: number;
  url?: string;
  is_done?: boolean;
  novel_id?: string;
  volume_id?: string;
  title?: string;
  /** Whether the chapter content is already cached on the server. Metadata only. */
  is_available?: boolean;
}

/** Paginated chapter-list response. Up to `limit` items per page. */
export interface LncrawlChaptersPage {
  total?: number;
  offset?: number;
  limit?: number;
  items: LncrawlChapterInfo[];
}

/** Normalized novel detail returned by OmniFlix's internal API route. */
export interface LncrawlNovelDetailPayload {
  novel: {
    id: string;
    title: string;
    coverImage?: string;
    description?: string;
    genres: string[];
    authors?: string;
    url?: string;
    chapterCount?: number;
    volumeCount?: number;
    domain?: string;
  };
}

/** Chapter batch returned by OmniFlix's internal API route. */
export interface LncrawlChapterBatchPayload {
  items: LncrawlChapterInfo[];
}

/**
 * Combined payload consumed by the novel layout — mirrors the shape of
 * `SuwayomiComicPayload` so the shared `ReadContent` UI treats both providers
 * uniformly. The synopsis is already normalized to plain text here.
 */
export interface LncrawlNovelPayload {
  novel: {
    id: string;
    title: string;
    type: "novels";
    coverImage?: string;
    description?: string;
    genres: string[];
    authors?: string;
    url?: string;
  };
  sourceName: string;
  chapters: LncrawlChapterInfo[];
}
