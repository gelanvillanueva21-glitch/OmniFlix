"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ExploreLayout } from "@/components/explore/ExploreLayout";
import { MediaCard } from "@/components/explore/MediaCard";
import { MediaCarousel } from "@/components/explore/MediaCarousel";
import { PopularContentList } from "@/components/explore/PopularContentList";
import { SearchBar } from "@/components/explore/SearchBar";
import {
    EmptyState,
    ErrorState,
    SectionHeader,
} from "@/components/explore/SectionHeader";
import {
    LoadingSkeleton,
    MediaRowSkeleton,
} from "@/components/explore/LoadingSkeleton";
import { LoadMoreControl } from "@/components/comics/LoadMoreControl";
import type { MediaItem } from "@/lib/media";

const NOVELS_API = "/api/novel";
const NOVELS_PAGE_SIZE = 12;

interface NovelsPageResponse {
    items: MediaItem[];
    hasNextPage: boolean;
}

async function fetchNovelsPage(page: number): Promise<NovelsPageResponse> {
    const search = new URLSearchParams({
        limit: String(NOVELS_PAGE_SIZE),
        page: String(page),
    });
    const response = await fetch(`${NOVELS_API}?${search.toString()}`);
    const payload = (await response.json()) as
        | NovelsPageResponse
        | { error: string };
    if (!response.ok || !("items" in payload)) {
        throw new Error(
            ("error" in payload && payload.error) ||
                "The novel provider is unavailable right now.",
        );
    }
    return payload;
}

/** Same novel id on consecutive pages is a duplicate; exact ids are not. */
function dedupeById(items: MediaItem[]): MediaItem[] {
    return [...new Map(items.map((item) => [item.id, item])).values()];
}

export function useNovels() {
    return useInfiniteQuery({
        queryKey: ["novels", "catalog"],
        queryFn: ({ pageParam }) => fetchNovelsPage(pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) =>
            lastPage.hasNextPage ? allPages.length + 1 : undefined,
        staleTime: 5 * 60 * 1000,
    });
}

export default function NovelsPage() {
    const novelsQuery = useNovels();
    // Same novel id re-served across pages is a duplicate; exact ids are not.
    const novels = dedupeById(
        novelsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    );


    const popularNovels = novelsQuery.data?.pages.flatMap((page) => page.items) ?? [];

    const featuredItem = novels[0];
    const carouselItems = novels.slice(0, NOVELS_PAGE_SIZE);

    return (
        <ExploreLayout
            utilities={
                <SearchBar
                    id="novels-search"
                    placeholder="Search novels…"
                />
            }
            popular={
                <PopularContentList
                    title="Popular Novels"
                    items={popularNovels}
                    error={
                        novelsQuery.isError
                            ? "Novel providers could not be loaded."
                            : undefined
                    }
                />
            }
        >
            {/* No <main> wrapper here: ExploreLayout's main already provides
                the page padding (px-4 py-6 sm:px-6 lg:px-8 lg:py-8), matching
                Comics. An extra wrapper double-applies it. */}
            <header className="mb-6">
                    <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[#F5F5F5] sm:text-3xl">
                        Novels
                    </h1>
                    <p className="mt-1 text-sm text-[#A1A1AA]">
                        Discover light novels and translated web novels.
                    </p>
                </header>

                <section aria-label="Featured novel" className="mb-8">
                    {novelsQuery.isPending ? (
                        <LoadingSkeleton className="aspect-12/5 w-full" />
                    ) : novelsQuery.isError ? (
                        <ErrorState
                            message={
                                novelsQuery.error instanceof Error
                                    ? novelsQuery.error.message
                                    : undefined
                            }
                            onRetry={() => novelsQuery.refetch()}
                        />
                    ) : featuredItem ? (
                        <MediaCard media={featuredItem} variant="wide" />
                    ) : (
                        <EmptyState
                            title="No novels returned"
                            description="The novel library is empty right now. Check back later."
                        />
                    )}
                </section>

                <section aria-label="Popular novels" className="mb-8 space-y-4">
                    <SectionHeader title="Popular Novels" />
                    {novelsQuery.isPending ? (
                        <MediaRowSkeleton />
                    ) : (
                        <MediaCarousel
                            items={carouselItems}
                            label="Popular Novels"
                        />
                    )}
                </section>

                <section aria-label="Browse novels" className="space-y-4">
                    <SectionHeader title="Browse Novels" />
                    {novelsQuery.isPending ? (
                        <div
                            role="status"
                            aria-label="Loading novels"
                            className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
                        >
                            {Array.from({ length: 10 }, (_, index) => (
                                <div key={index} className="space-y-2">
                                    <LoadingSkeleton className="aspect-2/3 w-full" />
                                    <LoadingSkeleton className="h-3.5 w-3/4" />
                                    <LoadingSkeleton className="h-3 w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : novelsQuery.isError ? (
                        <ErrorState
                            message={
                                novelsQuery.error instanceof Error
                                    ? novelsQuery.error.message
                                    : undefined
                            }
                            onRetry={() => novelsQuery.refetch()}
                        />
                    ) : novels.length === 0 ? (
                        <EmptyState
                            title="Nothing here yet"
                            description="No novels are available yet."
                        />
                    ) : (
                        <ul
                            role="list"
                            className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
                        >
                            {novels.map((item) => (
                                <li key={item.id}>
                                    <MediaCard media={item} />
                                </li>
                            ))}
                        </ul>
                    )}
                    <LoadMoreControl
                        hasNextPage={
                            novelsQuery.data
                                ? novelsQuery.hasNextPage
                                : false
                        }
                        isFetchingNextPage={novelsQuery.isFetchingNextPage}
                        onLoadMore={() => novelsQuery.fetchNextPage()}
                    />
                </section>
        </ExploreLayout>
    );
}
