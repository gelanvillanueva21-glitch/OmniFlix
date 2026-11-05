"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEntertainmentCollection } from "@/service/profile.service";
import { WatchReadContent } from "@/components/WatchReadContent";
import type {
    SeriesListState,
    WatchReadDetailState,
} from "@/components/WatchReadContent";
import { PopularContentList } from "@/components/PopularContentList";
import { usePopularAnime, usePopularSeries } from "./seriesQueries";
import type { JikanAnimeFetchPayload } from "@/service/types/JikanFetchPayload";
import type { TmdbSeriesFetchPayload } from "@/service/types/TmdbFetchPayload";
import type { MediaItem } from "@/lib/media";

const MAX_RECOMMENDATION_GENRES = 2;
const RECOMMENDATION_FALLBACK_LIMIT = 12;

interface SeriesReadContentProps {
    /** Raw prefixed card id, e.g. `tmdb:series:1396`, `tmdb-1396`, `jikan:1`, `jikan-1`. */
    readonly seriesId?: string;
}

type SeriesProvider = "tmdb" | "jikan";

interface ParsedSeriesId {
    readonly provider: SeriesProvider;
    readonly providerId: string;
}

type FetchedSeriesDetail =
    | {
          readonly provider: "tmdb";
          readonly providerId: string;
          readonly payload: TmdbSeriesFetchPayload;
      }
    | {
          readonly provider: "jikan";
          readonly providerId: string;
          readonly payload: JikanAnimeFetchPayload;
      };

export function SeriesReadContent({ seriesId }: SeriesReadContentProps) {
    const parsed = parseSeriesId(seriesId);
    const detailQuery = useQuery({
        queryKey: ["series", "detail", parsed?.provider, parsed?.providerId],
        queryFn: () => {
            if (parsed === null) {
                throw new Error("No valid series was selected.");
            }
            return fetchSeriesDetailPayload(parsed);
        },
        enabled: parsed !== null,
        staleTime: 5 * 60 * 1000,
    });

    const popularSeriesQuery = usePopularSeries();
    const popularAnimeQuery = usePopularAnime();
    const popularSeries = useMemo(
        () => popularSeriesQuery.data?.items ?? [],
        [popularSeriesQuery.data],
    );
    const popularAnime = useMemo(
        () => popularAnimeQuery.data?.items ?? [],
        [popularAnimeQuery.data],
    );

    const fetchedDetail = detailQuery.data;
    const currentId =
        fetchedDetail?.provider === "tmdb"
            ? `tmdb:series:${fetchedDetail.providerId}`
            : fetchedDetail?.provider === "jikan"
              ? `jikan:${fetchedDetail.providerId}`
              : null;

    const genreIds = useMemo(
        () =>
            fetchedDetail === undefined
                ? []
                : extractGenreIds(fetchedDetail),
        [fetchedDetail],
    );

    const genreRecommendationsQuery = useQuery({
        queryKey: [
            "series",
            "recommendations",
            fetchedDetail?.provider,
            fetchedDetail?.providerId,
            genreIds,
        ],
        queryFn: () => {
            if (fetchedDetail === undefined) {
                throw new Error("Series details are not available.");
            }
            return Promise.all(
                genreIds.map((genreId) =>
                    fetchSeriesGenrePage(fetchedDetail.provider, genreId),
                ),
            );
        },
        enabled: fetchedDetail !== undefined && genreIds.length > 0,
        staleTime: 5 * 60 * 1000,
    });

    const genreRecommendations = useMemo(
        () =>
            currentId === null
                ? []
                : dedupeRecommendations(
                      genreRecommendationsQuery.data?.flat() ?? [],
                      currentId,
                  ),
        [genreRecommendationsQuery.data, currentId],
    );
    const hasRecommendations = genreRecommendations.length > 0;
    const shouldUsePopularFallback =
        fetchedDetail !== undefined &&
        (genreIds.length === 0 || genreRecommendationsQuery.isFetched) &&
        (genreRecommendationsQuery.isError || !hasRecommendations);

    const recommendations = useMemo(() => {
        if (hasRecommendations) {
            return genreRecommendations;
        }
        if (currentId === null || !shouldUsePopularFallback) {
            return [];
        }
        const popularItems =
            fetchedDetail?.provider === "tmdb" ? popularSeries : popularAnime;
        return dedupeRecommendations(
            popularItems.slice(0, RECOMMENDATION_FALLBACK_LIMIT),
            currentId,
        );
    }, [
        hasRecommendations,
        genreRecommendations,
        currentId,
        shouldUsePopularFallback,
        fetchedDetail?.provider,
        popularSeries,
        popularAnime,
    ]);

    const recommendationsLabel = hasRecommendations
        ? "You Might Also Like"
        : fetchedDetail?.provider === "jikan"
          ? "Popular Anime"
          : "Popular Series";

    const listState = useSeriesListState(
        fetchedDetail?.provider ?? null,
        fetchedDetail?.providerId ?? null,
    );

    const detailState: WatchReadDetailState =
        parsed === null
            ? { status: "invalid", contentType: "series" }
            : detailQuery.isPending
              ? { status: "pending", contentType: "series" }
              : detailQuery.isError
                ? {
                      status: "error",
                      contentType: "series",
                      message:
                          detailQuery.error instanceof Error
                              ? detailQuery.error.message
                              : "Series details could not be loaded.",
                  }
                : fetchedDetail?.provider === "tmdb"
                  ? {
                        status: "ready",
                        contentType: "series",
                        provider: "tmdb",
                        payload: fetchedDetail.payload,
                        lists: listState,
                    }
                  : fetchedDetail?.provider === "jikan"
                    ? {
                          status: "ready",
                          contentType: "series",
                          provider: "jikan",
                          payload: fetchedDetail.payload,
                          lists: listState,
                      }
                    : { status: "pending", contentType: "series" };

    const popular = (
        <>
            <PopularContentList
                title="Popular Series"
                items={popularSeries}
                error={
                    popularSeriesQuery.error instanceof Error
                        ? "TMDB could not be loaded."
                        : undefined
                }
            />
            <PopularContentList
                title="Popular Anime"
                items={popularAnime}
                error={
                    popularAnimeQuery.error instanceof Error
                        ? "Jikan could not be loaded."
                        : undefined
                }
            />
        </>
    );

    return (
        <WatchReadContent
            detailState={detailState}
            recommendations={recommendations}
            recommendationsLabel={recommendationsLabel}
            popular={popular}
        />
    );
}

function extractGenreIds(detail: FetchedSeriesDetail): string[] {
    if (detail.provider === "tmdb") {
        return (detail.payload.series.genres ?? [])
            .map((genre) => genre.id)
            .filter(
                (genreId): genreId is number =>
                    genreId !== undefined &&
                    Number.isSafeInteger(genreId) &&
                    genreId > 0,
            )
            .map(String)
            .slice(0, MAX_RECOMMENDATION_GENRES);
    }

    const entries = [
        ...(detail.payload.anime.genres ?? []),
        ...(detail.payload.anime.themes ?? []),
        ...(detail.payload.anime.demographics ?? []),
    ];
    const genreIds: string[] = [];
    for (const entry of entries) {
        const genreId = entry.malId;
        if (
            typeof genreId === "number" &&
            Number.isSafeInteger(genreId) &&
            genreId > 0
        ) {
            genreIds.push(String(genreId));
        }
        if (genreIds.length >= MAX_RECOMMENDATION_GENRES) {
            break;
        }
    }
    return genreIds;
}

async function fetchSeriesGenrePage(
    provider: SeriesProvider,
    genreId: string,
): Promise<MediaItem[]> {
    const search = new URLSearchParams({
        provider,
        mediaType: provider === "tmdb" ? "series" : "anime",
        genre: genreId,
        page: "1",
    });
    const response = await fetch(`/api/explore/genre?${search.toString()}`);
    if (!response.ok) {
        throw new Error(
            provider === "tmdb"
                ? "The series genre results are unavailable right now."
                : "The anime genre results are unavailable right now.",
        );
    }
    const payload: unknown = await response.json();
    if (
        typeof payload !== "object" ||
        payload === null ||
        !("items" in payload) ||
        !Array.isArray(payload.items)
    ) {
        throw new Error("Series recommendations returned an invalid response.");
    }
    return payload.items as MediaItem[];
}

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

function parseSeriesId(rawSeriesId: string | undefined): ParsedSeriesId | null {
    if (rawSeriesId === undefined) {
        return null;
    }

    let seriesId = rawSeriesId;
    if (seriesId.includes("%")) {
        try {
            seriesId = decodeURIComponent(seriesId);
        } catch {
            return null;
        }
    }

    const colonMatch = /^(tmdb|jikan)(?::([^:]+))?:(\d+)$/.exec(seriesId);
    if (colonMatch) {
        const [, providerPrefix, scope, providerId] = colonMatch;
        if (
            (providerPrefix === "tmdb" && scope !== "series") ||
            (providerPrefix === "jikan" && scope !== undefined)
        ) {
            return null;
        }
        return {
            provider: providerPrefix as SeriesProvider,
            providerId,
        };
    }

    const dashMatch = /^(tmdb|jikan)-(\d+)$/.exec(seriesId);
    if (dashMatch) {
        return {
            provider: dashMatch[1] as SeriesProvider,
            providerId: dashMatch[2],
        };
    }

    return null;
}

async function fetchSeriesDetailPayload(
    parsed: ParsedSeriesId,
): Promise<FetchedSeriesDetail> {
    const url =
        parsed.provider === "tmdb"
            ? `/api/tmdb/series/${encodeURIComponent(parsed.providerId)}`
            : `/api/jikan/anime/${encodeURIComponent(parsed.providerId)}`;
    const response = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
    });

    let payload: unknown;
    try {
        payload = await response.json();
    } catch {
        throw new Error("The series API returned an invalid response.");
    }

    if (!response.ok) {
        throw new Error(
            getApiErrorMessage(payload) ?? "Series details could not be loaded.",
        );
    }

    if (parsed.provider === "tmdb") {
        return {
            provider: "tmdb",
            providerId: parsed.providerId,
            payload: payload as TmdbSeriesFetchPayload,
        };
    }
    return {
        provider: "jikan",
        providerId: parsed.providerId,
        payload: payload as JikanAnimeFetchPayload,
    };
}

function getApiErrorMessage(payload: unknown): string | undefined {
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

function useSeriesListState(
    provider: SeriesProvider | null,
    providerId: string | null,
): SeriesListState {
    const favoriteQuery = useQuery({
        queryKey: ["entertainment", "collection", "FAVORITE"],
        queryFn: () => getEntertainmentCollection("FAVORITE"),
        enabled: provider !== null && providerId !== null,
        staleTime: 60 * 1000,
    });
    const watchlistQuery = useQuery({
        queryKey: ["entertainment", "collection", "WATCHLIST"],
        queryFn: () => getEntertainmentCollection("WATCHLIST"),
        enabled: provider !== null && providerId !== null,
        staleTime: 60 * 1000,
    });

    function includesTitle(
        items: { externalId: string; apiSource: string }[] | undefined,
    ): boolean {
        return (
            provider !== null &&
            providerId !== null &&
            (items ?? []).some(
                (item) =>
                    item.externalId === providerId &&
                    item.apiSource.toUpperCase() === provider.toUpperCase(),
            )
        );
    }

    return {
        favorite: includesTitle(favoriteQuery.data),
        watchlist: includesTitle(watchlistQuery.data),
        loading:
            provider !== null &&
            providerId !== null &&
            (favoriteQuery.isPending || watchlistQuery.isPending),
    };
}
