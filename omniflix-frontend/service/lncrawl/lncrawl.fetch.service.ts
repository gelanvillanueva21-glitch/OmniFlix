
import "server-only";

import { providerRequest } from "../provider-client.service";
import { resolveProviderBaseUrl } from "@/lib/baseUrl";
import { getLncrawlAccessToken } from "./lncrawl.service";
import type {
  LncrawlChapterInfo,
  LncrawlChaptersPage,
  LncrawlNovelDetail,
} from "../types/lncrawl.fetch.payload";

export type {
  LncrawlChapterBatchPayload,
  LncrawlChapterInfo,
  LncrawlChaptersPage,
  LncrawlNovelDetail,
  LncrawlNovelDetailPayload,
  LncrawlNovelPayload,
} from "../types/lncrawl.fetch.payload";

/** Fixed LNCrawl chapter page size; pages are walked by `offset`. */
const CHAPTER_PAGE_SIZE = 100;

/**
 * Novel metadata — GET /api/novel/{novel_id}. Reuses the cached bearer-token
 * login from the existing LNCrawl service rather than re-implementing auth.
 */
export async function fetchNovelDataPayload(
  novelId: string,
): Promise<LncrawlNovelDetail> {
  const baseUrl = resolveBaseUrl();
  const accessToken = await getLncrawlAccessToken(baseUrl);

  return providerRequest<LncrawlNovelDetail>(
    `${baseUrl}/api/novel/${encodeURIComponent(novelId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}

/**
 * One page of chapter metadata for a novel — GET
 * /api/novel/{novel_id}/chapters?offset&limit, the same endpoint and page
 * convention `fetchNovelChapter` walks. Used by the Load More Chapters
 * control so already-displayed chapters are never refetched.
 */
export async function fetchNovelChapterPage(
  novelId: string,
  offset: number,
  limit: number = CHAPTER_PAGE_SIZE,
): Promise<LncrawlChapterInfo[]> {
  const baseUrl = resolveBaseUrl();
  const accessToken = await getLncrawlAccessToken(baseUrl);

  const page = await providerRequest<LncrawlChaptersPage>(
    `${baseUrl}/api/novel/${encodeURIComponent(novelId)}/chapters?offset=${offset}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
  );

  if (!Array.isArray(page.items)) {
    throw new Error("LNCrawl chapter response did not contain an items array.");
  }

  return page.items;
}


function resolveBaseUrl(): string {
  return resolveProviderBaseUrl({
    envVar: "NEXT_PUBLIC_LNCRAWL_API_URL",
    dockerHost: "lncrawl",
    dockerPort: 8181,
    serviceName: "LNCrawl",
  });
}
