"use client";

import { CatalogResultGrid } from "@/components/CatalogResultGrid";
import { LoadMoreControl } from "@/components/LoadMoreControl";
import { SectionHeader } from "@/components/SectionHeader";
import type { MediaItem } from "@/lib/media";

/** Mirrors catalog query state without coupling to a specific hook. */
export interface CatalogQueryLike {
    isPending: boolean;
    isFetching?: boolean;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    error?: unknown;
    refetch: () => void;
}

export interface SearchResultsSectionProps {
    submittedQuery: string;
    sourceHeading: string;
    catalogItems: MediaItem[];
    catalogQuery: CatalogQueryLike;
    onClearSearch: () => void;
    onLoadMore?: () => void;
}

function errorMessage(error: unknown): string | undefined {
    if (typeof error === "string") return error;
    return error instanceof Error ? error.message : undefined;
}

/** "Results for <query>" section with a clear-search control, result grid and load-more. */
export function SearchResultsSection({
    submittedQuery,
    sourceHeading,
    catalogItems,
    catalogQuery,
    onClearSearch,
    onLoadMore,
}: SearchResultsSectionProps) {
    return (
        <section aria-label="Search results" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <SectionHeader title={`Results for “${submittedQuery}”`} />
                <button
                    type="button"
                    onClick={onClearSearch}
                    className="rounded text-sm font-medium text-[#A1A1AA] transition-colors hover:text-[#A78BFA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                >
                    Clear search
                </button>
            </div>
            <CatalogResultGrid
                items={catalogItems}
                isPending={catalogQuery.isPending}
                isFetching={catalogQuery.isFetching ?? false}
                error={errorMessage(catalogQuery.error)}
                onRetry={() => catalogQuery.refetch()}
                emptyDescription={`No results found on ${sourceHeading} for “${submittedQuery}”.`}
            />
            <LoadMoreControl
                hasNextPage={catalogQuery.hasNextPage ?? false}
                isFetchingNextPage={catalogQuery.isFetchingNextPage ?? false}
                onLoadMore={onLoadMore ?? (() => {})}
            />
        </section>
    );
}

export { SearchResultsSection as SearchResultSection };

