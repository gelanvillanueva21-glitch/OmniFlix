"use client";

interface LoadMoreControlProps {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    onLoadMore: () => void;
}

export function LoadMoreControl({
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
}: LoadMoreControlProps) {
    if (!hasNextPage) return null;

    return (
        <div className="flex justify-center pt-2">
            <button
                type="button"
                onClick={onLoadMore}
                disabled={isFetchingNextPage}
                className="rounded-full border-[#29292E] px-5 py-2 text-sm font-medium text-[#F5F5F5] transition-colors hover:border-[#8B5CF6]/60 hover:bg-[#8B5CF6]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] disabled:opacity-50"
            >
                {isFetchingNextPage ? "Loading…" : "Load more"}
            </button>
        </div>
    );
}
