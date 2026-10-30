import { LoadingSkeleton, MediaRowSkeleton } from "./LoadingSkeleton";

export function ExploreContentSkeleton() {
    return (
        <div role="status" aria-label="Loading explore content" aria-busy="true">
            <div className="explore-skeleton-heading">
                <LoadingSkeleton className="explore-skeleton-title" />
                <LoadingSkeleton className="explore-skeleton-subtitle" />
            </div>

            <LoadingSkeleton className="explore-skeleton-featured" />

            <div className="explore-skeleton-section">
                <LoadingSkeleton className="explore-skeleton-section-title" />
                <MediaRowSkeleton />
            </div>

            <div className="explore-skeleton-section">
                <LoadingSkeleton className="explore-skeleton-section-title-wide" />
                <MediaRowSkeleton />
            </div>

            <div className="explore-skeleton-section">
                <LoadingSkeleton className="explore-skeleton-section-title-small" />
                <div className="explore-skeleton-chips" aria-hidden="true">
                    {Array.from({ length: 6 }, (_, index) => (
                        <LoadingSkeleton key={index} className="explore-skeleton-chip" />
                    ))}
                </div>
            </div>

            <div className="explore-skeleton-grid-section">
                <LoadingSkeleton className="explore-skeleton-grid-title" />
                <div className="media-grid">
                    {Array.from({ length: 10 }, (_, index) => (
                        <div key={index} className="media-grid-skeleton-cell">
                            <LoadingSkeleton className="media-grid-skeleton-poster" />
                            <LoadingSkeleton className="media-grid-skeleton-title" />
                            <LoadingSkeleton className="media-grid-skeleton-subtitle" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
