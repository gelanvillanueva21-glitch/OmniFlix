import { providerRequest, serverProviderUrl } from "../provider-client.service";
import type {
  SuwayomiChapter,
  SuwayomiChapterInfo,
  SuwayomiComicDetailsResult,
  SuwayomiComicPayload,
  SuwayomiComicPayloadResponse,
} from "../types/suwayomi.fetch.payload";


export type {
  SuwayomiChapterInfo,
  SuwayomiChaptersPage,
  SuwayomiComicDetailsResult,
  SuwayomiComicPayload,
} from "../types/suwayomi.fetch.payload";

interface SuwayomiResponse<T> {
  data?: T;
  errors?: Array<{ message?: string }>;
}

const SUWAYOMI_ID_PREFIX = "suwayomi";

interface ParsedSuwayomiComicId {
  sourceIdentifier: string;
  comicId: number;
}


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

const COMIC_PAYLOAD_MUTATION = `
    mutation FetchMangaAndChapters($id: Int!, $fetchManga: Boolean!, $fetchChapters: Boolean!) {
        fetchMangaAndChapters(
            input: { id: $id, fetchManga: $fetchManga, fetchChapters: $fetchChapters }
        ) {
            manga {
                id title description thumbnailUrl genre status author artist url realUrl
                sourceId
                source { id name }
            }
            chapters {
                id mangaId name chapterNumber scanlator uploadDate
            }
        }
    }
`;


export async function fetchSuwayomiComicPayload(
  sourceAwareId: string,
): Promise<SuwayomiComicPayload> {
  const { sourceIdentifier, comicId } = parseSuwayomiComicId(sourceAwareId);

  const baseUrl = serverProviderUrl(
    "NEXT_PUBLIC_SUWAYOMI_API_URL",
    "suwayomi",
    4567,
  );
  if (!baseUrl) throw new Error("Suwayomi URL is not configured.");

  console.log(comicId);
  const response = await graphQl<SuwayomiComicPayloadResponse>(
    baseUrl,
    COMIC_PAYLOAD_MUTATION,
    { id: comicId, fetchManga: true, fetchChapters: true },
  );

  const comic = response.fetchMangaAndChapters?.manga;
  if (!comic || !comic.title) {
    throw new Error(`Comic not found for id ${sourceAwareId}.`);
  }


  const returnedSourceId = comic.source?.id ?? comic.sourceId;
  if (String(returnedSourceId) !== String(sourceIdentifier)) {
    throw new Error(
      "Comic source mismatch: the requested id belongs to a different source.",
    );
  }

  const rawChapters = response.fetchMangaAndChapters?.chapters ?? [];

  const foreign = rawChapters.find((chapter) => chapter.mangaId !== comicId);
  if (foreign) {
    throw new Error("Suwayomi returned chapters belonging to another comic.");
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
    chapters: mapChapters(rawChapters),
  };
}

function mapChapters(nodes: SuwayomiChapter[]): SuwayomiChapterInfo[] {
  return nodes
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
}

export async function fetchSuwayomiComicDetails(
  sourceAwareId: string,
): Promise<SuwayomiComicDetailsResult> {
  const payload = await fetchSuwayomiComicPayload(sourceAwareId);
  return { comic: payload.comic, sourceName: payload.sourceName };
}

async function graphQl<T>(
  baseUrl: string,
  query: string,
  variables?: Record<string, string | number | boolean | undefined>,
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
