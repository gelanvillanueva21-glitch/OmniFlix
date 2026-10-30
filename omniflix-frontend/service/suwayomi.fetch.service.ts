import type { MediaItem } from "@/lib/media";
import { providerRequest, serverProviderUrl } from "./provider-client.service";

/**
 * Source-aware comic details and chapter fetching for Suwayomi.
 *
 * This module is independent from `suwayomi.service.ts` (which owns catalog,
 * search and source discovery) so the detail/chapter code paths can evolve
 * separately. It follows the same conventions: the same GraphQL request
 * pattern, the same provider-image URL convention, and the same
 * `suwayomi:<sourceIdentifier>:<numericComicId>` card-ID identity produced by
 * the catalog mapper in `suwayomi.service.ts`.
 *
 * OmniFlix treats every Suwayomi item generically as a Comic (manga, manhwa,
 * manhua, etc. — whichever content an installed extension supplies).
 * Suwayomi's own GraphQL schema names (`manga`, `mangaId`, …) are preserved
 * at the API boundary; only application-level naming is generalized.
 */

interface SuwayomiResponse<T> {
  data?: T;
  errors?: Array<{ message?: string }>;
}

/** Detailed comic shape mapped from Suwayomi's `manga` query result. */
interface SuwayomiComicDetails {
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

interface SuwayomiChapter {
  id: number;
  mangaId: number;
  name?: string | null;
  chapterNumber?: number | null;
  scanlator?: string | null;
  uploadDate?: number | null;
}

export interface SuwayomiChapterInfo {
  id: number;
  mangaId: number;
  name: string;
  chapterNumber?: number;
  scanlator?: string;
  uploadDate?: number;
}

export interface SuwayomiChaptersPage {
  chapters: SuwayomiChapterInfo[];
  /** True when the server reports another bounded page of chapters. */
  hasNextPage: boolean;
}

const SUWAYOMI_ID_PREFIX = "suwayomi";

/** Default bounded chapter page size (not "everything"). */
const CHAPTERS_PAGE_SIZE = 100;
/** Hard cap on chapter pages per request so pagination cannot run unbounded. */
const CHAPTERS_MAX_PAGES = 10;

interface ParsedSuwayomiComicId {
  sourceIdentifier: string;
  comicId: number;
}

/**
 * Parses `suwayomi:<sourceIdentifier>:<numericComicId>`. Throws on a wrong
 * provider prefix, malformed identifier, or a non-integer comic ID.
 */
function parseSuwayomiComicId(sourceAwareId: string): ParsedSuwayomiComicId {
  const parts = sourceAwareId.split(":");
  if (parts.length !== 3 || parts[0] !== SUWAYOMI_ID_PREFIX) {
    throw new Error(
      "Invalid comic id: expected suwayomi:<sourceIdentifier>:<comicId>.",
    );
  }
  const [, sourceIdentifier, rawComicId] = parts;
  if (!sourceIdentifier) {
    throw new Error("Invalid comic id: missing source identifier.");
  }
  const comicId = Number(rawComicId);
  if (!rawComicId || !Number.isInteger(comicId) || comicId < 1) {
    throw new Error("Invalid comic id: comic id must be a positive integer.");
  }
  return { sourceIdentifier, comicId };
}

// Field and input names below (`manga`, `mangaId`, …) belong to Suwayomi's
// GraphQL schema and must stay unchanged. The `comic` alias only renames the
// application-facing response property.
const COMIC_DETAILS_QUERY = `
    query ComicDetails($id: Int!) {
        comic: manga(id: $id) {
            id title description thumbnailUrl genre status author artist url realUrl
            sourceId
            source { id name }
        }
    }
`;

const CHAPTERS_QUERY = `
    query ComicChapters($mangaId: Int!, $offset: Int!, $first: Int!) {
        chapters(condition: { mangaId: $mangaId }, offset: $offset, first: $first) {
            totalCount
            nodes { id mangaId name chapterNumber scanlator uploadDate }
        }
    }
`;

/**
 * Fetches details for one comic using a source-aware card ID
 * (`suwayomi:<sourceIdentifier>:<comicId>`). The returned comic's Suwayomi
 * source identity is validated against the identifier encoded in the card ID;
 * a mismatch is rejected rather than returning data from the wrong source.
 */
export async function fetchSuwayomiComicDetails(
  sourceAwareId: string,
): Promise<SuwayomiComicDetailsResult> {
  const { sourceIdentifier, comicId } = parseSuwayomiComicId(sourceAwareId);

  const baseUrl = serverProviderUrl(
    "NEXT_PUBLIC_SUWAYOMI_API_URL",
    "suwayomi",
    4567,
  );
  if (!baseUrl) throw new Error("Suwayomi URL is not configured.");

  const response = await graphQl<{ comic: SuwayomiComicDetails | null }>(
    baseUrl,
    COMIC_DETAILS_QUERY,
    { id: comicId },
  );

  const comic = response.comic;
  if (!comic || !comic.title) {
    throw new Error(`Comic not found for id ${sourceAwareId}.`);
  }

  // Source isolation: the numeric comic database id is not globally unique
  // across sources, so the returned source identity must match the card ID.
  const returnedSourceId = comic.source?.id ?? comic.sourceId;
  if (String(returnedSourceId) !== String(sourceIdentifier)) {
    throw new Error(
      "Comic source mismatch: the requested id belongs to a different source.",
    );
  }

  const description = comic.description?.trim() || undefined;

  return {
    comic: {
      id: sourceAwareId,
      title: comic.title,
      type: "comics" as const,
      coverImage: comic.thumbnailUrl
        ? `/api/provider-image?provider=suwayomi&path=${encodeURIComponent(comic.thumbnailUrl)}`
        : undefined,
      description,
      genres: comic.genre ?? [],
      status: comic.status ?? undefined,
      author: comic.author ?? undefined,
      artist: comic.artist ?? undefined,
      url: comic.realUrl ?? comic.url ?? undefined,
    },
    sourceName: comic.source?.name ?? undefined,
  };
}

/**
 * Fetches one bounded page of chapters for a source-aware comic card ID.
 * Offset pagination with a fixed page size and hard page cap; chapters are
 * validated to belong to the requested comic and sorted ascending by number.
 * Callers paginate by passing `page` — nothing here fetches all chapters.
 */
export async function fetchSuwayomiChapters(
  sourceAwareId: string,
  page = 1,
): Promise<SuwayomiChaptersPage> {
  const { sourceIdentifier, comicId } = parseSuwayomiComicId(sourceAwareId);
  if (!Number.isInteger(page) || page < 1) {
    throw new Error("Chapter page must be a positive integer.");
  }
  if (page > CHAPTERS_MAX_PAGES) {
    throw new Error(
      `Chapter page ${page} exceeds the maximum of ${CHAPTERS_MAX_PAGES} pages.`,
    );
  }

  const baseUrl = serverProviderUrl(
    "NEXT_PUBLIC_SUWAYOMI_API_URL",
    "suwayomi",
    4567,
  );
  if (!baseUrl) throw new Error("Suwayomi URL is not configured.");

  // Cheap source-isolation guard: fetch the owning comic's source identity
  // with a minimal query before exposing chapters for this numeric id.
  const ownerCheck = await graphQl<{
    comic: { sourceId: string; source?: { id: string } | null } | null;
  }>(
    baseUrl,
    `query ComicSourceCheck($id: Int!) { comic: manga(id: $id) { sourceId source { id } } }`,
    { id: comicId },
  );
  const owner = ownerCheck.comic;
  if (!owner) {
    throw new Error(`Comic not found for id ${sourceAwareId}.`);
  }
  if (String(owner.source?.id ?? owner.sourceId) !== String(sourceIdentifier)) {
    throw new Error(
      "Comic source mismatch: the requested id belongs to a different source.",
    );
  }

  const offset = (page - 1) * CHAPTERS_PAGE_SIZE;
  const response = await graphQl<{
    chapters: { totalCount: number; nodes: SuwayomiChapter[] } | null;
  }>(baseUrl, CHAPTERS_QUERY, {
    // `mangaId` is Suwayomi's schema input name; it carries our comic id.
    mangaId: comicId,
    offset,
    first: CHAPTERS_PAGE_SIZE,
  });

  const nodes = response.chapters?.nodes ?? [];
  const totalCount = response.chapters?.totalCount ?? 0;

  // Every chapter must belong to the requested comic id.
  const foreign = nodes.find((chapter) => chapter.mangaId !== comicId);
  if (foreign) {
    throw new Error("Suwayomi returned chapters belonging to another comic.");
  }

  const chapters = nodes
    .map((chapter) => ({
      id: chapter.id,
      mangaId: chapter.mangaId,
      name: chapter.name?.trim() || "Untitled chapter",
      chapterNumber: chapter.chapterNumber ?? undefined,
      scanlator: chapter.scanlator?.trim() || undefined,
      uploadDate: chapter.uploadDate ?? undefined,
    }))
    .sort(
      (first, second) =>
        (first.chapterNumber ?? Number.POSITIVE_INFINITY) -
        (second.chapterNumber ?? Number.POSITIVE_INFINITY),
    );

  const hasNextPage = offset + nodes.length < totalCount;
  return { chapters, hasNextPage };
}

async function graphQl<T>(
  baseUrl: string,
  query: string,
  variables?: Record<string, string | number | undefined>,
): Promise<T> {
  const response = await providerRequest<SuwayomiResponse<T>>(
    `${baseUrl}/api/graphql`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    },
  );

  if (response.errors?.length || !response.data) {
    throw new Error(
      response.errors?.[0]?.message ?? "Suwayomi returned no data.",
    );
  }

  return response.data;
}
