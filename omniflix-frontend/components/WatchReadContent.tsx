"use client";

import {
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import "@/components/Notification.css";
import { useMoreMenu } from "@/components/moreMenu";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExploreLayout } from "@/components/layouts/explore/ExploreLayout";
import { DetailSkeleton } from "@/components/loading/ContentDetailLoad";
import { MediaCarousel } from "@/components/MediaCarousel";
import {
    ArrowLeftIcon,
    BookmarkIcon,
    CheckCircleIcon,
    CheckIcon,
    HeartIcon,
    ImageIcon,
    MoreVerticalIcon,
    PlayIcon,
} from "@/components/icons/icons";
import type { MediaItem } from "@/lib/media";
import { useAuth } from "./AuthProvider";
import {
    saveCompleted,
    saveFavorite,
    saveWatchList,
    type SaveContentArgs,
} from "@/service/save.content.service";
import {
    saveArgsFromJikanAnime,
    saveArgsFromTmdbMovie,
    saveArgsFromTmdbSeries,
} from "@/service/save.content.service";
import { Notification } from "./Notification";
import type { EntertainmentListType } from "@/service/types/profile.payload";
import type {
    JikanAnimeFetchPayload,
    JikanEpisode,
} from "@/service/types/JikanFetchPayload";
import type {
    TmdbMovieFetchPayload,
    TmdbSeriesFetchPayload,
} from "@/service/types/TmdbFetchPayload";

export type WatchReadDetailState =
    | {
          readonly status: "invalid";
          readonly contentType: "movie" | "series";
      }
    | {
          readonly status: "pending";
          readonly contentType: "movie" | "series";
      }
    | {
          readonly status: "error";
          readonly contentType: "movie" | "series";
          readonly message: string;
      }
    | {
          readonly status: "ready";
          readonly contentType: "movie";
          readonly payload: TmdbMovieFetchPayload;
      }
    | {
          readonly status: "ready";
          readonly contentType: "series";
          readonly provider: "tmdb";
          readonly payload: TmdbSeriesFetchPayload;
          readonly lists: SeriesListState;
      }
    | {
          readonly status: "ready";
          readonly contentType: "series";
          readonly provider: "jikan";
          readonly payload: JikanAnimeFetchPayload;
          readonly lists: SeriesListState;
      };

export interface SeriesListState {
    readonly favorite: boolean;
    readonly watchlist: boolean;
    readonly loading: boolean;
}

interface WatchReadContentProps {
    readonly detailState: WatchReadDetailState;
    readonly recommendations: readonly MediaItem[];
    readonly recommendationsLabel: string;
    readonly popular: ReactNode;
}

interface DetailHeaderData {
    readonly title: string;
    readonly posterImage?: string;
    readonly providerLabel: string;
    readonly rating?: number;
    readonly firstYear?: string;
    readonly status?: string;
    readonly countLabel?: string;
    readonly genres: string[];
    readonly description?: string;
}

export function WatchReadContent({
    detailState,
    recommendations,
    recommendationsLabel,
    popular,
}: WatchReadContentProps) {
    const router = useRouter();

    function handleBack() {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else {
            router.push(
                detailState.contentType === "series"
                    ? "/explore/series"
                    : "/explore/movies",
            );
        }
    }

    const detail =
        detailState.status === "invalid" ? (
            <WatchDetailError
                contentType={detailState.contentType}
                message={`This ${detailState.contentType} address is malformed or unsupported.`}
            />
        ) : detailState.status === "pending" ? (
            <div className="series-detail-loading">
                <DetailSkeleton />
            </div>
        ) : detailState.status === "error" ? (
            <WatchDetailError
                contentType={detailState.contentType}
                message={detailState.message}
            />
        ) : detailState.contentType === "movie" ? (
            <MovieDetail
                payload={detailState.payload}
                saveArgs={saveArgsFromTmdbMovie(detailState.payload)}
                onBack={handleBack}
            />
        ) : detailState.provider === "tmdb" ? (
            <TmdbSeriesDetail
                payload={detailState.payload}
                saveArgs={saveArgsFromTmdbSeries(detailState.payload)}
                lists={detailState.lists}
                onBack={handleBack}
            />
        ) : (
            <JikanAnimeDetail
                payload={detailState.payload}
                saveArgs={saveArgsFromJikanAnime(detailState.payload)}
                lists={detailState.lists}
                onBack={handleBack}
            />
        );

    return (
        <ExploreLayout popular={popular}>
            {detail}
            {detailState.status === "ready" &&
                recommendations.length > 0 && (
                    <section
                        aria-label={recommendationsLabel}
                        className="readContentRecommendations"
                    >
                        <h2 className="readContentRecommendationsTitle">
                            {recommendationsLabel}
                        </h2>
                        <MediaCarousel
                            items={[...recommendations]}
                            label={recommendationsLabel}
                        />
                    </section>
                )}
        </ExploreLayout>
    );
}

function MovieDetail({
    payload,
    saveArgs,
    onBack,
}: {
    payload: TmdbMovieFetchPayload;
    saveArgs: SaveContentArgs;
    onBack: () => void;
}) {
    const title = payload.title ?? payload.originalTitle ?? "Untitled movie";
    const metadata: DetailHeaderData = {
        title,
        posterImage: payload.posterImage,
        providerLabel: "TMDB",
        rating: payload.rating,
        firstYear:
            payload.releaseYear !== undefined
                ? String(payload.releaseYear)
                : undefined,
        status: payload.status,
        countLabel:
            payload.runtimeMinutes !== undefined
                ? `${payload.runtimeMinutes} min`
                : undefined,
        genres: payload.genres,
        description: payload.overview,
    };

    return (
        <article className="series-detail">
            <DetailHeader
                data={metadata}
                onBack={onBack}
                contentType="movie"
                saveArgs={saveArgs}
            />
        </article>
    );
}

function TmdbSeriesDetail({
    payload,
    saveArgs,
    lists,
    onBack,
}: {
    payload: TmdbSeriesFetchPayload;
    saveArgs: SaveContentArgs;
    lists: SeriesListState;
    onBack: () => void;
}) {
    const seasonsWithEpisodes = payload.seasons.filter(
        (season) => season.episodes.length > 0,
    );
    const defaultSeasonNumber =
        seasonsWithEpisodes.find((season) => season.seasonNumber > 0)
            ?.seasonNumber ?? seasonsWithEpisodes[0]?.seasonNumber ?? 0;
    const [preferredSeason, setPreferredSeason] = useState(defaultSeasonNumber);
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
            <DetailHeader
                onBack={onBack}
                contentType="series"
                lists={lists}
                saveArgs={saveArgs}
                data={{
                    title,
                    posterImage: series.poster_path
                        ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
                        : undefined,
                    providerLabel: "TMDB",
                    rating,
                    firstYear: series.first_air_date?.slice(0, 4) || undefined,
                    status: payload.status,
                    countLabel:
                        series.number_of_episodes !== undefined &&
                        series.number_of_episodes !== null
                            ? `${series.number_of_episodes} ${
                                  series.number_of_episodes === 1
                                      ? "episode"
                                      : "episodes"
                              }`
                            : undefined,
                    genres: (series.genres ?? [])
                        .map((genre) => genre.name)
                        .filter(
                            (name): name is string =>
                                name !== undefined && name !== "",
                        ),
                    description: series.overview ?? undefined,
                }}
            />

            <section className="series-detail-episodes" aria-label="Episodes">
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
        <div className="series-detail-episode-scroll">
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
                                    alt={
                                        episode.title ??
                                        `Episode ${episode.episodeNumber}`
                                    }
                                    fill
                                    sizes="176px"
                                    className="series-detail-episode-still-image"
                                />
                            ) : (
                                <div className="series-detail-episode-still-empty">
                                    <ImageIcon className="series-detail-episode-placeholder-icon" />
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
        </div>
    );
}

function JikanAnimeDetail({
    payload,
    saveArgs,
    lists,
    onBack,
}: {
    payload: JikanAnimeFetchPayload;
    saveArgs: SaveContentArgs;
    lists: SeriesListState;
    onBack: () => void;
}) {
    const anime = payload.anime;
    const genres = [
        ...(anime.genres ?? []),
        ...(anime.themes ?? []),
        ...(anime.demographics ?? []),
    ]
        .map((entry) => entry.name)
        .filter((name): name is string => name !== undefined && name !== "");
    const title = anime.title ?? "Untitled anime";

    return (
        <article className="series-detail">
            <DetailHeader
                onBack={onBack}
                contentType="series"
                lists={lists}
                saveArgs={saveArgs}
                data={{
                    title,
                    posterImage: anime.imageUrl ?? undefined,
                    providerLabel: "Jikan",
                    rating:
                        typeof anime.score === "number" && anime.score > 0
                            ? anime.score
                            : undefined,
                    firstYear:
                        anime.year !== null && anime.year !== undefined
                            ? String(anime.year)
                            : anime.aired?.from?.slice(0, 4) || undefined,
                    status: payload.status,
                    countLabel:
                        anime.episodes !== null &&
                        anime.episodes !== undefined
                            ? `${anime.episodes} ${
                                  anime.episodes === 1 ? "episode" : "episodes"
                              }`
                            : undefined,
                    genres,
                    description: anime.synopsis ?? undefined,
                }}
            />

            <section className="series-detail-episodes" aria-label="Episodes">
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

function JikanEpisodeList({ episodes }: { episodes: JikanEpisode[] }) {
    if (episodes.length === 0) {
        return (
            <p className="series-detail-episode-list-empty">
                No episode information is available for this anime yet.
            </p>
        );
    }

    return (
        <div className="series-detail-episode-scroll">
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
                                    {episode.title ??
                                        `Episode ${episode.number}`}
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
        </div>
    );
}

function DetailHeader({
    data,
    onBack,
    contentType,
    lists,
    saveArgs,
}: {
    data: DetailHeaderData;
    onBack: () => void;
    contentType: "movie" | "series";
    lists?: SeriesListState;
    saveArgs: SaveContentArgs;
}) {
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
        data.countLabel,
    ].filter((part) => part !== null && part !== undefined);

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
                    <DetailPoster image={data.posterImage} title={data.title} />
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
                                className={`series-detail-metadata-part${
                                    index > 0
                                        ? " series-detail-metadata-separator"
                                        : ""
                                }`}
                            >
                                {part}
                            </span>
                        ))}
                    </p>
                    <h1 className="series-detail-title">{data.title}</h1>
                    <DetailDescription
                        text={data.description ?? "No description available."}
                    />
                    {(data.firstYear !== undefined ||
                        data.status !== undefined ||
                        data.countLabel !== undefined) && (
                        <dl className="series-detail-facts">
                            {data.firstYear !== undefined && (
                                <DetailFact
                                    label={
                                        contentType === "movie"
                                            ? "Release year"
                                            : "First aired"
                                    }
                                    value={data.firstYear}
                                />
                            )}
                            {data.status !== undefined && (
                                <DetailFact
                                    label="Status"
                                    value={data.status}
                                />
                            )}
                            {data.countLabel !== undefined && (
                                <DetailFact
                                    label={
                                        contentType === "movie"
                                            ? "Runtime"
                                            : "Episodes"
                                    }
                                    value={data.countLabel}
                                />
                            )}
                        </dl>
                    )}
                    <DetailActions
                        contentType={contentType}
                        title={data.title}
                        lists={lists}
                        saveArgs={saveArgs}
                    />
                </div>
            </div>
        </>
    );
}

function DetailPoster({
    image,
    title,
}: {
    image?: string;
    title: string;
}) {
    const [imageFailed, setImageFailed] = useState(false);
    const showImage = image !== undefined && !imageFailed;

    return (
        <div className="series-detail-poster-frame">
            {showImage ? (
                <Image
                    src={image}
                    alt={`Poster of ${title}`}
                    fill
                    sizes="(max-width: 768px) 40vw, 260px"
                    className="series-detail-poster"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <div className="series-detail-poster-placeholder">
                    <ImageIcon className="series-detail-poster-placeholder-icon" />
                </div>
            )}
        </div>
    );
}

function DetailDescription({ text }: { text: string }) {
    const [expanded, setExpanded] = useState(false);
    const [overflows, setOverflows] = useState(false);
    const textRef = useRef<HTMLParagraphElement | null>(null);

    useEffect(() => {
        const element = textRef.current;
        if (element === null || expanded) {
            return;
        }
        const nowOverflows = element.scrollHeight > element.clientHeight + 1;
        setOverflows((current) =>
            current === nowOverflows ? current : nowOverflows,
        );
    }, [expanded, text]);

    return (
        <div className="series-detail-description-container">
            <p
                ref={textRef}
                className={`series-detail-description${
                    expanded ? " series-detail-description-expanded" : ""
                }`}
            >
                {text}
            </p>
            {overflows && (
                <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setExpanded((current) => !current)}
                    className="series-detail-description-toggle"
                >
                    {expanded ? "See less" : "See more"}
                </button>
            )}
        </div>
    );
}

function DetailFact({ label, value }: { label: string; value: string }) {
    return (
        <>
            <dt className="series-detail-fact-label">{label}</dt>
            <dd className="series-detail-fact-value">{value}</dd>
        </>
    );
}

function DetailActions({
    contentType,
    title,
    lists,
    saveArgs,
}: {
    contentType: "movie" | "series";
    title: string;
    lists?: SeriesListState;
    saveArgs: SaveContentArgs;
}) {
    const moreWrapperRef = useRef<HTMLDivElement | null>(null);
    const moreMenu = useMoreMenu(moreWrapperRef);
    const { open: moreOpen } = moreMenu;
    // The three-dot list menu only makes sense for signed-in users.
    const { isAuthenticated } = useAuth();
    // Rectangle banner shown when a save was skipped (item already in list).
    const [notification, setNotification] = useState<string | null>(null);

    /** Label of the list a menu key stands for, used in the notification. */
    const LIST_LABELS: Record<EntertainmentListType, string> = {
        FAVORITE: "Favorite",
        WATCHLIST: "Watchlist",
        READLIST: "ReadList",
        COMPLETED: "Completed",
        ON_HOLD: "On Hold",
        DROPPED: "Dropped",
    };

    /**
     * Persists the item into the chosen list. Each key maps to one of the
     * dedicated save functions, which hardcode their EntertainmentListType.
     */
    async function handleSaving(key: string): Promise<void> {
        const saveFn =
            key === "FAVORITE"
                ? saveFavorite
                : key === "WATCHLIST"
                    ? saveWatchList
                    : saveCompleted;
        try {
            const saved = await saveFn(saveArgs);
            moreMenu.close();
            // undefined ⇒ the item was already in that list, nothing was saved.
            if (saved === undefined) {
                setNotification(
                    `${title} is already in your ${LIST_LABELS[key as EntertainmentListType]}`,
                );
            }
        } catch (error) {
            console.error("Could not save to list", error);
        }
    }

    return (
        <>
        {notification !== null && (
            <Notification
                message={notification}
                onDismiss={() => setNotification(null)}
            />
        )}
        <div className="series-detail-actions">
            <button
                type="button"
                disabled
                className="series-detail-play-button"
                title={
                    contentType === "series"
                        ? "Episode playback is not available yet — OmniFlix does not host video streams."
                        : "Movie playback is not available yet — OmniFlix does not host video streams."
                }
            >
                <PlayIcon className="series-detail-control-icon" />
                Play
            </button>

            {isAuthenticated && (
            <div
                ref={moreWrapperRef}
                className="series-detail-more-wrapper"
            >
                <button
                    type="button"
                    className="series-detail-more-button"
                    aria-haspopup="menu"
                    aria-expanded={moreOpen}
                    aria-controls={
                        moreOpen ? moreMenu.popoverId : undefined
                    }
                    aria-label="More actions"
                    onClick={moreMenu.toggle}
                >
                    <MoreVerticalIcon className="series-detail-control-icon" />
                </button>

                {moreOpen && (
                    <div
                        id={moreMenu.popoverId}
                        role="menu"
                        aria-label="List options"
                        className="series-detail-more-popover"
                    >
                        {contentType === "series" &&
                        lists !== undefined &&
                        lists.loading ? (
                            <p className="series-detail-list-status">
                                Checking your lists…
                            </p>
                        ) : (
                            moreMenuOptions(contentType, lists).map(
                                ({ key, label, selected, Icon }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        role="menuitem"
                                        className={`series-detail-list-option${
                                            selected
                                                ? " series-detail-list-option-selected"
                                                : ""
                                        }`}
                                        onClick={() => handleSaving(key)}
                                    >
                                        <Icon className="series-detail-list-option-icon" />
                                        <span className="series-detail-list-option-label">
                                            {label}
                                        </span>
                                        {selected && (
                                            <CheckIcon className="series-detail-list-option-selected-icon" />
                                        )}
                                    </button>
                                ),
                            )
                        )}
                    </div>
                )}
            </div>
            )}
        </div>
        </>
    );
}

/**
 * Menu options for the three-dot popover. Series with loaded list state
 * reflect the actual favorite/watchlist flags; movies (and series without
 * list state) show permanently-disabled placeholder options.
 */
function moreMenuOptions(
    contentType: "movie" | "series",
    lists: SeriesListState | undefined,
): readonly { key: string; label: string; selected: boolean; Icon: (props: { className?: string }) => ReactNode }[] {
    if (contentType === "series" && lists !== undefined && !lists.loading) {
        return [
            {
                key: "FAVORITE",
                label: "Favorite",
                selected: lists.favorite,
                Icon: HeartIcon,
            },
            {
                key: "WATCHLIST",
                label: "Watchlist",
                selected: lists.watchlist,
                Icon: BookmarkIcon,
            },
            {
                key: "COMPLETED",
                label: "Complete",
                selected: false,
                Icon: CheckCircleIcon,
            },
        ];
    }
    return [
        { key: "FAVORITE", label: "Favorite", selected: false, Icon: HeartIcon },
        {
            key: "WATCHLIST",
            label: "Watchlist",
            selected: false,
            Icon: BookmarkIcon,
        },
        {
            key: "COMPLETED",
            label: "Complete",
            selected: false,
            Icon: CheckCircleIcon,
        },
    ];
}

function WatchDetailError({
    contentType,
    message,
}: {
    contentType: "movie" | "series";
    message: string;
}) {
    const title = contentType === "series" ? "Series unavailable" : "Movie unavailable";
    const href =
        contentType === "series" ? "/explore/series" : "/explore/movies";
    const label = contentType === "series" ? "Back to Series" : "Back to Movies";

    return (
        <section className="series-detail-error">
            <h1>{title}</h1>
            <p>{message}</p>
            <Link href={href}>{label}</Link>
        </section>
    );
}

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
