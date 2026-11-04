"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ExploreLayout } from "../explore/ExploreLayout";
import { PopularContentList } from "@/components/PopularContentList";
import { DetailSkeleton } from "@/components/loading/ContentDetailLoad";
import { ArrowLeftIcon, ImageIcon } from "@/components/icons/icons";
import { usePopularAnime, usePopularSeries } from "./seriesQueries";
import type { TmdbSeriesFetchPayload } from "@/service/types/TmdbFetchPayload";
import type { JikanAnimeFetchPayload } from "@/service/types/JikanFetchPayload";

/**
 * Detail view for a single series, TMDB or Jikan. The route page
 * (app/explore/series/[id]/page.tsx) passes the raw prefixed card id
 * through; the provider and numeric id are resolved here so the detail API
 * routes only ever receive bare numeric ids.
 */
export function SeriesReadContent({ seriesId }: SeriesReadContentProps) {
    const parsed = parseSeriesId(seriesId);
    const detailQuery = useQuery({
        queryKey: ["series", "detail", parsed?.provider, parsed?.providerId],
        queryFn: () => fetchSeriesDetailPayload(parsed as ParsedSeriesId),
        enabled: parsed !== null,
        staleTime: 5 * 60 * 1000,
    });

    const provider = parsed?.provider ?? null;
    const back = useBackNavigation();

    // Sidebar mirrors the catalog page's series sidebar — both provider
    // lists, without the search bar — via the existing browse queries,
    // entirely independent of the detail payload.
    const popularSeriesQuery = usePopularSeries();
    const popularAnimeQuery = usePopularAnime();
    const popularSeries = popularSeriesQuery.data?.items ?? [];
    const popularAnime = popularAnimeQuery.data?.items ?? [];

    return (
        <ExploreLayout
            popular={
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
            }
        >
            {parsed === null ? (
                <SeriesDetailError
                    message="This series address is malformed or unsupported."
                />
            ) : detailQuery.isPending ? (
                <div className="p-4">
                    <DetailSkeleton />
                </div>
            ) : detailQuery.isError ? (
                <SeriesDetailError
                    message={
                        detailQuery.error instanceof Error
                            ? detailQuery.error.message
                            : "Series details could not be loaded."
                    }
                />
            ) : provider === "tmdb" ? (
                <TmdbSeriesDetail
                    payload={detailQuery.data as TmdbSeriesFetchPayload}
                    onBack={back}
                />
            ) : (
                <JikanAnimeDetail
                    payload={detailQuery.data as JikanAnimeFetchPayload}
                    onBack={back}
                />
            )}
        </ExploreLayout>
    );
}

interface SeriesReadContentProps {
    /** Raw prefixed card id, e.g. `tmdb:series:1396`, `tmdb-1396`, `jikan:1`, `jikan-1`. */
    readonly seriesId?: string;
}


type SeriesProvider = "tmdb" | "jikan";

interface ParsedSeriesId {
    readonly provider: SeriesProvider;
    /** Bare numeric provider id, validated before any request is made. */
    readonly providerId: string;
}

/**
 * Resolves the provider from the existing card-id prefixes:
 *
 *   TMDB   — `tmdb:series:{id}` (browse) and `tmdb-{id}` (search)
 *   Jikan  — `jikan:{malId}` (browse) and `jikan-{malId}` (search)
 *
 * The route segment may arrive percent-encoded (the browser URL holds
 * `tmdb%3Aseries%3A1400`, `jikan%3A52991`), so the raw value is decoded
 * first and the same regexes then handle both the encoded and decoded forms.
 * Anything else (bare numbers, comics/novel ids, typos) is rejected as null
 * so the page renders its invalid-id state instead of firing a bad request.
 */
function parseSeriesId(rawSeriesId: string | undefined): ParsedSeriesId | null {
    if (rawSeriesId === undefined) {
        return null;
    }

    // `%3A` (colon) survives in the dynamic segment when the id was placed
    // in the URL encoded; restore the separators before matching.
    let seriesId = rawSeriesId;
    if (seriesId.includes("%")) {
        try {
            seriesId = decodeURIComponent(seriesId);
        } catch {
            return null;
        }
    }

    // `tmdb:series:{id}` carries a scope segment; `jikan:{malId}` does not.
    const colonMatch = /^(tmdb|jikan)(?::([^:]+))?:(\d+)$/.exec(seriesId);
    if (colonMatch) {
        const [, providerPrefix, scope, id] = colonMatch;
        // TMDB ids are only series ids; `tmdb:movie:...` belongs elsewhere.
        if (providerPrefix === "tmdb" && scope !== "series") {
            return null;
        }
        return { provider: providerPrefix as SeriesProvider, providerId: id };
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

/**
 * Client fetch of the detail payload through the server-side API routes —
 * the `server-only` fetch services are never imported here.
 */
async function fetchSeriesDetailPayload(
    parsed: ParsedSeriesId,
): Promise<TmdbSeriesFetchPayload | JikanAnimeFetchPayload> {
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
        const message = getApiErrorMessage(payload);
        throw new Error(message ?? "Series details could not be loaded.");
    }

    return payload as TmdbSeriesFetchPayload | JikanAnimeFetchPayload;
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


interface DetailHeaderData {
    readonly title: string;
    readonly posterImage?: string;
    readonly providerLabel: string;
    readonly rating?: number;
    readonly firstYear?: string;
    readonly status?: string;
    readonly episodeCount?: number;
    readonly genres: string[];
    readonly description?: string;
}

/**
 * Poster + information block shared by both providers so they present
 * identically while each maps its own payload into `DetailHeaderData`.
 */
function SeriesDetailHeader({
    data,
    onBack,
}: {
    data: DetailHeaderData;
    onBack: () => void;
}) {
    const [posterFailed, setPosterFailed] = useState(false);
    const showPoster = data.posterImage !== undefined && !posterFailed;

    const metadataParts = [
        <span key="provider" className="series-detail-metadata-provider">
            {data.providerLabel}
        </span>,
        data.rating !== undefined ? (
            <span key="rating" className="series-detail-metadata-rating">
                ★ {data.rating.toFixed(1)}
            </span>
        ) : null,
        data.firstYear,
        data.status,
        data.episodeCount !== undefined
            ? `${data.episodeCount} ${data.episodeCount === 1 ? "episode" : "episodes"}`
            : null,
    ].filter((part) => part !== null);

    return (
        <>
            <button
                type="button"
                aria-label="Go back"
                className="series-detail-back"
                onClick={onBack}
            >
                <ArrowLeftIcon className="series-detail-back-icon" />
            </button>

            <div className="series-detail-row">
                <div className="series-detail-poster-section">
                    <div className="series-detail-poster-frame">
                        {showPoster ? (
                            <Image
                                src={data.posterImage as string}
                                alt={`Poster of ${data.title}`}
                                fill
                                sizes="(max-width: 768px) 40vw, 260px"
                                className="series-detail-poster"
                                onError={() => setPosterFailed(true)}
                            />
                        ) : (
                            <div className="series-detail-poster-placeholder">
                                <ImageIcon className="series-detail-poster-placeholder-icon" />
                            </div>
                        )}
                    </div>
                    {data.genres.length > 0 && (
                        <ul
                            className="series-detail-genre-list"
                            aria-label="Genres"
                        >
                            {data.genres.map((genre) => (
                                <li
                                    key={genre}
                                    className="series-detail-genre-tag"
                                >
                                    {genre}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="series-detail-info">
                    <p className="series-detail-metadata">
                        {metadataParts.map((part, index) => (
                            <span
                                key={index}
                                className={`series-detail-metadata-part${index > 0 ? " series-detail-metadata-separator" : ""
                                    }`}
                            >
                                {part}
                            </span>
                        ))}
                    </p>

                    <h1 className="series-detail-title">{data.title}</h1>

                    {data.description !== undefined ? (
                        <p className="series-detail-description">
                            {data.description}
                        </p>
                    ) : (
                        <p className="series-detail-description">
                            No description available.
                        </p>
                    )}

                    {(data.firstYear !== undefined ||
                        data.status !== undefined ||
                        data.episodeCount !== undefined) && (
                            <dl className="series-detail-facts">
                                {data.firstYear !== undefined && (
                                    <SeriesFact
                                        label="First aired"
                                        value={data.firstYear}
                                    />
                                )}
                                {data.status !== undefined && (
                                    <SeriesFact label="Status" value={data.status} />
                                )}
                                {data.episodeCount !== undefined && (
                                    <SeriesFact
                                        label="Episodes"
                                        value={String(data.episodeCount)}
                                    />
                                )}
                            </dl>
                        )}

                    <div className="series-detail-actions">
                        <button
                            type="button"
                            disabled
                            className="series-detail-action-primary"
                        >
                            Watchlist
                        </button>
                        <button
                            type="button"
                            disabled
                            className="series-detail-action-secondary"
                        >
                            Favorite
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

function SeriesFact({ label, value }: { label: string; value: string }) {
    return (
        <>
            <dt className="series-detail-fact-label">{label}</dt>
            <dd className="series-detail-fact-value">{value}</dd>
        </>
    );
}

/**
 * Back navigation shared by the detail views. Browser history is preferred;
 * when the page was opened directly the Explore series catalog is used.
 */
function useBackNavigation() {
    const router = useRouter();
    return () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else {
            router.push("/explore/series");
        }
    };
}



function TmdbSeriesDetail({
    payload,
}: {
    payload: TmdbSeriesFetchPayload;
    onBack: () => void;
}) {
    const back = useBackNavigation();

    const seasonsWithEpisodes = payload.seasons.filter(
        (season) => season.episodes.length > 0,
    );
    // Season 1 over specials (season 0) when both exist.
    const defaultSeasonNumber =
        seasonsWithEpisodes.find((season) => season.seasonNumber > 0)
            ?.seasonNumber ?? seasonsWithEpisodes[0]?.seasonNumber ?? 0;
    const [preferredSeason, setPreferredSeason] = useState(defaultSeasonNumber);
    // Fall back to the first populated season when the stored selection is
    // not part of the payload (e.g. the only loaded season failed) — derived
    // directly, no effect needed.
    const selectedSeason = seasonsWithEpisodes.some(
        (season) => season.seasonNumber === preferredSeason,
    )
        ? preferredSeason
        : seasonsWithEpisodes[0]?.seasonNumber ?? 0;

    const series = payload.series;

    const currentSeason = payload.seasons.find(
        (season) => season.seasonNumber === selectedSeason,
    );

    const title = series.name ?? series.original_name ?? "Untitled series";
    const rating =
        typeof series.vote_average === "number" && series.vote_average > 0
            ? series.vote_average
            : undefined;

    return (
        <article className="series-detail">
            <SeriesDetailHeader
                onBack={back}
                data={{
                    title,
                    posterImage: series.poster_path
                        ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
                        : undefined,
                    providerLabel: "TMDB",
                    rating,
                    firstYear: series.first_air_date?.slice(0, 4),
                    status: payload.status,
                    episodeCount: series.number_of_episodes ?? undefined,
                    genres: (series.genres ?? [])
                        .map((genre) => genre.name)
                        .filter((name): name is string => name !== undefined),
                    description: series.overview ?? undefined,
                }}
            />

            <section
                className="series-detail-episodes"
                aria-label="Episodes"
            >
                <div className="series-detail-episodes-header">
                    <h2 className="series-detail-episodes-title">
                        {currentSeason?.name ?? "Episodes"}
                    </h2>
                    {seasonsWithEpisodes.length > 1 && (
                        <select
                            className="series-detail-season-select"
                            aria-label="Select season"
                            value={selectedSeason}
                            onChange={(event) =>
                                setPreferredSeason(Number(event.target.value))
                            }
                        >
                            {seasonsWithEpisodes.map((season) => (
                                <option
                                    key={season.seasonNumber}
                                    value={season.seasonNumber}
                                >
                                    {season.name ??
                                        (season.seasonNumber === 0
                                            ? "Specials"
                                            : `Season ${season.seasonNumber}`)}
                                    {" · "}
                                    {season.episodeCount} episodes
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {payload.failedSeasons.length > 0 && (
                    <p className="series-detail-episodes-note" role="status">
                        Season{payload.failedSeasons.length === 1 ? "" : "s"}{" "}
                        {payload.failedSeasons.join(", ")} could not be loaded.
                    </p>
                )}

                <TmdbEpisodeList
                    episodes={currentSeason?.episodes ?? []}
                    seasonNumber={selectedSeason}
                />
            </section>
        </article>
    );
}

function TmdbEpisodeList({
    episodes,
    seasonNumber,
}: {
    episodes: TmdbSeriesFetchPayload["seasons"][number]["episodes"];
    seasonNumber: number;
}) {
    if (episodes.length === 0) {
        return (
            <p className="series-detail-episode-list-empty">
                No episodes available for this season yet.
            </p>
        );
    }

    return (
        <ol className="series-detail-episode-list">
            {episodes.map((episode) => (
                <li
                    key={`${seasonNumber}-${episode.episodeNumber}`}
                    className="series-detail-episode-row"
                >
                    <div className="series-detail-episode-still">
                        {episode.stillImage !== undefined ? (
                            <Image
                                src={episode.stillImage}
                                alt={episode.title ?? `Episode ${episode.episodeNumber}`}
                                fill
                                sizes="176px"
                                className="series-detail-episode-still-image"
                            />
                        ) : (
                            <div className="series-detail-episode-still-empty">
                                <ImageIcon className="h-5 w-5" />
                            </div>
                        )}
                    </div>
                    <div className="series-detail-episode-body">
                        <h3 className="series-detail-episode-heading">
                            <span className="series-detail-episode-number">
                                E{episode.episodeNumber}
                            </span>
                            <span>
                                {episode.title ??
                                    `Episode ${episode.episodeNumber}`}
                            </span>
                            {episode.airDate !== undefined && (
                                <span className="series-detail-episode-air-date">
                                    {formatAirDate(episode.airDate)}
                                </span>
                            )}
                        </h3>
                        {episode.overview !== undefined && (
                            <p className="series-detail-episode-overview">
                                {episode.overview}
                            </p>
                        )}
                        <div className="series-detail-episode-meta">
                            {episode.runtimeMinutes !== undefined && (
                                <span>{episode.runtimeMinutes} min</span>
                            )}
                            {episode.rating !== undefined && (
                                <span>★ {episode.rating.toFixed(1)}</span>
                            )}
                        </div>
                    </div>
                </li>
            ))}
        </ol>
    );
}


function JikanAnimeDetail({
    payload,
}: {
    payload: JikanAnimeFetchPayload;
    onBack: () => void;
}) {
    const back = useBackNavigation();
    const anime = payload.anime;
    const poster = anime.imageUrl ?? undefined;

    const genres = [
        ...(anime.genres ?? []),
        ...(anime.themes ?? []),
        ...(anime.demographics ?? []),
    ]
        .map((entry) => entry.name)
        .filter((name): name is string => name !== undefined);

    return (
        <article className="series-detail">
            <SeriesDetailHeader
                onBack={back}
                data={{
                    title: anime.title ?? "Untitled anime",
                    posterImage: poster,
                    providerLabel: "Jikan",
                    rating:
                        typeof anime.score === "number" && anime.score > 0
                            ? anime.score
                            : undefined,
                    firstYear:
                        anime.year !== null && anime.year !== undefined
                            ? String(anime.year)
                            : anime.aired?.from?.slice(0, 4),
                    status: payload.status,
                    episodeCount: anime.episodes ?? undefined,
                    genres,
                    description: anime.synopsis ?? undefined,
                }}
            />

            <section
                className="series-detail-episodes"
                aria-label="Episodes"
            >
                <div className="series-detail-episodes-header">
                    <h2 className="series-detail-episodes-title">Episodes</h2>
                </div>

                {payload.episodesTruncated && (
                    <p className="series-detail-episodes-note" role="status">
                        The episode list was too long to load in full — older
                        episodes may be missing.
                    </p>
                )}

                <JikanEpisodeList episodes={payload.episodes} />
            </section>
        </article>
    );
}

function JikanEpisodeList({
    episodes,
}: {
    episodes: JikanAnimeFetchPayload["episodes"];
}) {
    if (episodes.length === 0) {
        return (
            <p className="series-detail-episode-list-empty">
                No episode information is available for this anime yet.
            </p>
        );
    }

    return (
        <ol className="series-detail-episode-list">
            {episodes.map((episode) => (
                <li
                    key={episode.number}
                    className="series-detail-episode-row"
                >
                    <div className="series-detail-episode-body">
                        <h3 className="series-detail-episode-heading">
                            <span className="series-detail-episode-number">
                                Ep {episode.number}
                            </span>
                            <span>
                                {episode.title ?? `Episode ${episode.number}`}
                            </span>
                            {episode.aired !== undefined && (
                                <span className="series-detail-episode-air-date">
                                    {episode.aired}
                                </span>
                            )}
                        </h3>
                        <div className="series-detail-episode-meta">
                            {episode.score !== undefined && (
                                <span>★ {episode.score.toFixed(1)}</span>
                            )}
                            {episode.filler === true && <span>Filler</span>}
                            {episode.recap === true && <span>Recap</span>}
                        </div>
                    </div>
                </li>
            ))}
        </ol>
    );
}


/**
 * Deterministic date rendering (fixed locale + UTC) so server-rendered and
 * client HTML always match — the same hydration rule `ReadContent` follows.
 */
function formatAirDate(airDate: string): string {
    const date = new Date(airDate);
    if (Number.isNaN(date.getTime())) {
        return airDate;
    }
    return new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(date);
}

export function SeriesDetailError({ message }: { message: string }) {
    return (
        <section className="series-detail-error">
            <h1>Series unavailable</h1>
            <p>{message}</p>
            <Link href="/explore/series">Back to Series</Link>
        </section>
    );
}
