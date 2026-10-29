import { LoadingSkeleton, MediaRowSkeleton } from "./LoadingSkeleton";

export function ExploreContentSkeleton() {
    return (
        <div role="status" aria-label="Loading explore content" aria-busy="true">
            <div className="mb-6 space-y-3">
                <LoadingSkeleton className="h-9 w-36" />
                <LoadingSkeleton className="h-5 w-96 max-w-full" />
            </div>

            <LoadingSkeleton className="mb-8 aspect-12/5 w-full" />

            <div className="mb-8 space-y-4">
                <LoadingSkeleton className="h-6 w-40" />
                <MediaRowSkeleton />
            </div>

            <div className="mb-8 space-y-4">
                <LoadingSkeleton className="h-6 w-52" />
                <MediaRowSkeleton />
            </div>

            <div className="mb-8 space-y-4">
                <LoadingSkeleton className="h-8 w-44" />
                <div className="flex gap-2 overflow-hidden" aria-hidden="true">
                    {Array.from({ length: 6 }, (_, index) => (
                        <LoadingSkeleton key={index} className="h-9 w-24 shrink-0 rounded-full" />
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <LoadingSkeleton className="h-6 w-36" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                    {Array.from({ length: 10 }, (_, index) => (
                        <div key={index} className="space-y-2">
                            <LoadingSkeleton className="aspect-2/3 w-full" />
                            <LoadingSkeleton className="h-3.5 w-3/4" />
                            <LoadingSkeleton className="h-3 w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
