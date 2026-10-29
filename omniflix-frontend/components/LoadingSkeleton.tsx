/** Simple rectangular shimmer placeholder, reusing the existing .skeleton-shimmer class. */

interface LoadingSkeletonProps {
    readonly className?: string;
}

export function LoadingSkeleton({ className = "h-full w-full" }: LoadingSkeletonProps) {
    return (
        <div
            aria-hidden="true"
            className={`skeleton-shimmer relative overflow-hidden rounded-lg bg-surface-secondary ${className}`}
        />
    );
}

/** Featured-banner sized skeleton. */
export function FeaturedSkeleton() {
    return <LoadingSkeleton className="aspect-12/5 w-full" />;
}

/** Row of poster-sized skeletons. */
export function MediaRowSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="flex gap-4 overflow-hidden" aria-hidden="true">
            {Array.from({ length: count }, (_, index) => (
                <div key={index} className="w-36 shrink-0 space-y-2 sm:w-44">
                    <LoadingSkeleton className="aspect-2/3 w-full" />
                    <LoadingSkeleton className="h-3.5 w-3/4" />
                    <LoadingSkeleton className="h-3 w-1/2" />
                </div>
            ))}
        </div>
    );
}
