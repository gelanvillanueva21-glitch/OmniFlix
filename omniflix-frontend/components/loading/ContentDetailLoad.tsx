

export function DetailSkeleton() {
    return (
        <article className="readContent" aria-busy="true">
            <div className="detailRow">
                <div className="detailsSection">
                    <div className="skeleton-shimmer h-8 w-2/3 rounded-md mb-4" />
                    <div className="skeleton-shimmer h-4 w-1/3 rounded-md mb-6" />
                    <div className="skeleton-shimmer h-24 w-full rounded-md mb-6" />
                    <div className="skeleton-shimmer h-10 w-48 rounded-lg" />
                </div>
            </div>
        </article>
    );
}

