import { ExploreContentSkeleton } from "@/components/explore/ExploreLoadingSkeleton";

export default function Loading() {
    return (
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <ExploreContentSkeleton />
        </main>
    );
}
