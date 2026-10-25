"use client";

import { ExploreLayout } from "@/components/explore/ExploreLayout";
import { FeaturedNovelSection } from "@/components/novels/FeaturedNovelSection";
import { PopularNovelsCarousel } from "@/components/novels/PopularNovelsCarousel";
import { BrowseNovelsSection } from "@/components/novels/BrowseNovelsSection";
import { NovelsSidebar } from "@/components/novels/NovelsSidebar";
import {
    dedupeById,
    NOVELS_PAGE_SIZE,
    useNovels,
} from "@/components/novels/novelsQueries";

export default function NovelsPage() {
    const novelsQuery = useNovels();
    // Same novel id re-served across pages is a duplicate; exact ids are not.
    const novels = dedupeById(
        novelsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    );

    const popularNovels = novelsQuery.data?.pages.flatMap((page) => page.items) ?? [];

    const featuredItem = novels[0];
    const carouselItems = novels.slice(0, NOVELS_PAGE_SIZE);

    const sidebar = NovelsSidebar({
        popularNovels,
        error: novelsQuery.isError
            ? "Novel providers could not be loaded."
            : undefined,
    });

    const errorMessage =
        novelsQuery.error instanceof Error
            ? novelsQuery.error.message
            : undefined;
    const refetch = () => novelsQuery.refetch();

    return (
        <ExploreLayout
            utilities={sidebar.utilities}
            popular={sidebar.popular}
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

            <FeaturedNovelSection
                isPending={novelsQuery.isPending}
                isError={novelsQuery.isError}
                errorMessage={errorMessage}
                onRetry={refetch}
                featuredItem={featuredItem}
            />

            <PopularNovelsCarousel
                items={carouselItems}
                isPending={novelsQuery.isPending}
            />

            <BrowseNovelsSection
                isPending={novelsQuery.isPending}
                isError={novelsQuery.isError}
                errorMessage={errorMessage}
                onRetry={refetch}
                novels={novels}
                hasNextPage={novelsQuery.data ? novelsQuery.hasNextPage : false}
                isFetchingNextPage={novelsQuery.isFetchingNextPage}
                onLoadMore={() => novelsQuery.fetchNextPage()}
            />
        </ExploreLayout>
    );
}
