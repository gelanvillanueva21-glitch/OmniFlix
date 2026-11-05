"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PopularContentList } from "@/components/PopularContentList";
import { WatchReadContent } from "@/components/WatchReadContent";
import type { WatchReadDetailState } from "@/components/WatchReadContent";
import { usePopularMovies } from "@/components/layouts/movies/moviesQueries";
import type { MediaItem } from "@/lib/media";
import type { TmdbMovieFetchPayload } from "@/service/types/TmdbFetchPayload";

interface MovieReadContentProps {
    readonly movieId?: string;
}

const MAX_RECOMMENDATION_GENRES = 2;
const RECOMMENDATION_FALLBACK_LIMIT = 12;

export function MovieReadContent({ movieId }: MovieReadContentProps) {
    const parsedMovieId = parseMovieId(movieId);
    const detailQuery = useQuery({
        queryKey: ["movies", "detail", parsedMovieId],
        queryFn: () => {
            if (parsedMovieId === null) {
                throw new Error("No valid movie was selected.");
            }
            return fetchMovieDetailPayload(parsedMovieId);
        },
        enabled: parsedMovieId !== null,
        staleTime: 5 * 60 * 1000,
    });

    const popularMoviesQuery = usePopularMovies();
    const popularMovies = useMemo(
        () => popularMoviesQuery.data?.items ?? [],
        [popularMoviesQuery.data],
    );
    const fetchedMovie = detailQuery.data;
    const genreIds = useMemo(
        () =>
            fetchedMovie?.genreIds
                .filter(
                    (genreId) =>
                        Number.isSafeInteger(genreId) && genreId > 0,
                )
                .slice(0, MAX_RECOMMENDATION_GENRES)
                .map(String) ?? [],
        [fetchedMovie?.genreIds],
    );

    const genreRecommendationsQuery = useQuery({
        queryKey: ["movies", "recommendations", parsedMovieId, genreIds],
        queryFn: () => fetchMovieGenrePages(genreIds),
        enabled: fetchedMovie !== undefined && genreIds.length > 0,
        staleTime: 5 * 60 * 1000,
    });

    const currentId =
        parsedMovieId === null ? null : `tmdb:movies:${parsedMovieId}`;
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
        fetchedMovie !== undefined &&
        (genreIds.length === 0 || genreRecommendationsQuery.isFetched) &&
        (genreRecommendationsQuery.isError || !hasRecommendations);

    const recommendations = useMemo(() => {
        if (hasRecommendations) {
            return genreRecommendations;
        }
        if (currentId === null || !shouldUsePopularFallback) {
            return [];
        }
        return dedupeRecommendations(
            popularMovies.slice(0, RECOMMENDATION_FALLBACK_LIMIT),
            currentId,
        );
    }, [
        hasRecommendations,
        genreRecommendations,
        currentId,
        shouldUsePopularFallback,
        popularMovies,
    ]);

    const recommendationsLabel = hasRecommendations
        ? "You Might Also Like"
        : "Popular Movies";

    const detailState: WatchReadDetailState =
        parsedMovieId === null
            ? { status: "invalid", contentType: "movie" }
            : detailQuery.isPending
              ? { status: "pending", contentType: "movie" }
              : detailQuery.isError
                ? {
                      status: "error",
                      contentType: "movie",
                      message:
                          detailQuery.error instanceof Error
                              ? detailQuery.error.message
                              : "Movie details could not be loaded.",
                  }
                : fetchedMovie === undefined
                  ? { status: "pending", contentType: "movie" }
                  : {
                        status: "ready",
                        contentType: "movie",
                        payload: fetchedMovie,
                    };

    const popular = (
        <PopularContentList
            title="Popular Movies"
            items={popularMovies}
            error={
                popularMoviesQuery.error instanceof Error
                    ? "Movie providers could not be loaded."
                    : undefined
            }
        />
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

function parseMovieId(rawMovieId: string | undefined): string | null {
    if (rawMovieId === undefined) {
        return null;
    }

    let movieId = rawMovieId;
    if (movieId.includes("%")) {
        try {
            movieId = decodeURIComponent(movieId);
        } catch {
            return null;
        }
    }

    const match = /^(?:tmdb:movies:|tmdb-)([1-9]\d*)$/.exec(movieId);
    if (!match || !Number.isSafeInteger(Number(match[1]))) {
        return null;
    }
    return match[1];
}

async function fetchMovieDetailPayload(
    movieId: string,
): Promise<TmdbMovieFetchPayload> {
    const response = await fetch(
        `/api/tmdb/movie/${encodeURIComponent(movieId)}`,
        {
            headers: { Accept: "application/json" },
            cache: "no-store",
        },
    );

    let payload: unknown;
    try {
        payload = await response.json();
    } catch {
        throw new Error("The movie API returned an invalid response.");
    }
    if (!response.ok) {
        throw new Error(
            getApiErrorMessage(payload) ?? "Movie details could not be loaded.",
        );
    }
    if (!isTmdbMovieFetchPayload(payload)) {
        throw new Error("The movie API returned an invalid response.");
    }
    return payload;
}

async function fetchMovieGenrePages(
    genreIds: readonly string[],
): Promise<MediaItem[][]> {
    return Promise.all(
        genreIds.map(async (genreId) => {
            const search = new URLSearchParams({
                provider: "tmdb",
                mediaType: "movies",
                genre: genreId,
                page: "1",
            });
            const response = await fetch(
                `/api/explore/genre?${search.toString()}`,
            );
            if (!response.ok) {
                throw new Error(
                    "The movie genre results are unavailable right now.",
                );
            }

            const payload: unknown = await response.json();
            if (
                typeof payload !== "object" ||
                payload === null ||
                !("items" in payload) ||
                !Array.isArray(payload.items)
            ) {
                throw new Error(
                    "Movie recommendations returned an invalid response.",
                );
            }
            return payload.items as MediaItem[];
        }),
    );
}

function isTmdbMovieFetchPayload(
    payload: unknown,
): payload is TmdbMovieFetchPayload {
    return (
        typeof payload === "object" &&
        payload !== null &&
        "id" in payload &&
        typeof payload.id === "number" &&
        Number.isSafeInteger(payload.id) &&
        "genres" in payload &&
        Array.isArray(payload.genres) &&
        "genreIds" in payload &&
        Array.isArray(payload.genreIds) &&
        payload.genreIds.every(
            (genreId) =>
                typeof genreId === "number" &&
                Number.isSafeInteger(genreId) &&
                genreId > 0,
        ) &&
        "productionCompanies" in payload &&
        Array.isArray(payload.productionCompanies)
    );
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
