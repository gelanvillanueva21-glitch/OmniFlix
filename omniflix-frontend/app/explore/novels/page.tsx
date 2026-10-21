"use client";
import { useQuery } from "@tanstack/react-query";
import { ExploreLayout } from "@/components/explore/ExploreLayout";
import { PopularContentList } from "@/components/explore/PopularContentList";
import { SearchBar } from "@/components/explore/SearchBar";
import { ErrorState } from "@/components/explore/SectionHeader";
import { LoadingSkeleton } from "@/components/explore/LoadingSkeleton";
import type { MediaItem } from "@/lib/media";

const POPULAR_NOVELS_API = "/api/novel/popular";
/** The backend route already caps the list at 10; slice again as a guard. */
const POPULAR_NOVELS_LIMIT = 10;

interface PopularNovelsResponse {
    novels: MediaItem[];
}

async function fetchPopularNovels(): Promise<PopularNovelsResponse> {
    const response = await fetch(POPULAR_NOVELS_API);
    const payload = (await response.json()) as
        | PopularNovelsResponse
        | { error: string };
    if (!response.ok || !("novels" in payload)) {
        throw new Error(
            ("error" in payload && payload.error) ||
                "The novel provider is unavailable right now.",
        );
    }
    return payload;
}

export function usePopularNovels() {
    return useQuery({
        queryKey: ["novels", "popular"],
        queryFn: fetchPopularNovels,
        staleTime: 5 * 60 * 1000,
    });
}

export default function NovelsPage() {
    const popularNovelsQuery = usePopularNovels();
    const novels =
        popularNovelsQuery.data?.novels.slice(0, POPULAR_NOVELS_LIMIT) ?? [];

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
                    items={novels}
                    error={
                        popularNovelsQuery.isError
                            ? "Novel providers could not be loaded."
                            : undefined
                    }
                />
            }
        >
            <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <header className="mb-6">
                    <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[#F5F5F5] sm:text-3xl">
                        Novels
                    </h1>
                    <p className="mt-1 text-sm text-[#A1A1AA]">
                        Discover light novels and translated web novels.
                    </p>
                </header>
                {popularNovelsQuery.isPending ? (
                    <div className="space-y-3" aria-busy="true">
                        <LoadingSkeleton className="h-6 w-40" />
                        <LoadingSkeleton className="aspect-2/3 w-full max-w-48" />
                    </div>
                ) : popularNovelsQuery.isError ? (
                    <ErrorState message="Popular novels could not be loaded." />
                ) : novels.length === 0 ? (
                    <p className="text-sm text-[#A1A1AA]">
                        No novels are available yet.
                    </p>
                ) : null}
            </main>
        </ExploreLayout>
    );
}
