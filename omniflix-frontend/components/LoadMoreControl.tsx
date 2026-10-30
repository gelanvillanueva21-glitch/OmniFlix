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
        <div className="load-more-wrapper">
            <button
                type="button"
                onClick={onLoadMore}
                disabled={isFetchingNextPage}
                className="load-more-button"
            >
                {isFetchingNextPage ? "Loading…" : "Load more"}
            </button>
        </div>
    );
}
