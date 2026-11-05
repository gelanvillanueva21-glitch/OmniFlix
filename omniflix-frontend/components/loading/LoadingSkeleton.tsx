/** Simple rectangular shimmer placeholder, reusing the existing .skeleton-shimmer class. */

interface LoadingSkeletonProps {
    readonly className?: string;
}

export function LoadingSkeleton({ className = "h-full w-full" }: LoadingSkeletonProps) {
    return (
        <div
            aria-hidden="true"
            className={`skeleton-shimmer loading-skeleton ${className}`}
        />
    );
}

/** Featured-banner sized skeleton. */
export function FeaturedSkeleton() {
    return <LoadingSkeleton className="media-card-wide-frame" />;
}

/** Row of poster-sized skeletons. */
export function MediaRowSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="media-row-skeleton" aria-hidden="true">
            {Array.from({ length: count }, (_, index) => (
                <div key={index} className="media-row-skeleton-item">
                    <LoadingSkeleton className="media-grid-skeleton-poster" />
                    <LoadingSkeleton className="media-grid-skeleton-title" />
                    <LoadingSkeleton className="media-grid-skeleton-subtitle" />
                </div>
            ))}
        </div>
    );
}
