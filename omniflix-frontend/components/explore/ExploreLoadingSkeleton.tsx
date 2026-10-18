import { SidebarLogo } from "./SidebarNavigation";
import { LoadingSkeleton, MediaRowSkeleton } from "./LoadingSkeleton";

function SkeletonSidebar() {
    return (
        <div className="flex h-full flex-col" aria-hidden="true">
            <div className="px-2 pt-1 pb-6">
                <SidebarLogo />
            </div>
            <div className="space-y-3">
                <LoadingSkeleton className="h-3 w-16 rounded" />
                {Array.from({ length: 5 }, (_, index) => (
                    <LoadingSkeleton
                        key={index}
                        className="h-11 w-full rounded-lg"
                    />
                ))}
            </div>
            <div className="mt-auto space-y-3 border-t border-[#29292E] pt-5" aria-hidden="true">
                <LoadingSkeleton className="h-3 w-16 rounded" />
                <LoadingSkeleton className="h-11 w-full rounded-lg" />
                <LoadingSkeleton className="h-11 w-full rounded-lg" />
            </div>
        </div>
    );
}

function UtilityButtonsSkeleton() {
    return (
        <div className="flex items-center gap-1" aria-hidden="true">
            <LoadingSkeleton className="h-11 w-11 rounded-lg" />
            <LoadingSkeleton className="h-11 w-11 rounded-lg" />
            <LoadingSkeleton className="h-11 w-11 rounded-lg" />
        </div>
    );
}

function ExploreContentSkeleton() {
    return (
        <div aria-hidden="true">
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

            <LoadingSkeleton className="h-8 w-44" />
        </div>
    );
}

export default function ExploreLoadingSkeleton() {
    return (
        <div className="min-h-screen bg-[#111111] text-[#F5F5F5]">
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-[#29292E] bg-[#171719] px-4 py-4 lg:block xl:w-64">
                <SkeletonSidebar />
            </aside>

            <div className="sticky top-0 z-40 hidden border-b border-[#29292E] bg-[#111111]/90 px-4 py-2 backdrop-blur-md lg:block xl:hidden">
                <div className="flex items-center justify-between gap-4">
                    <SidebarLogo />
                    <UtilityButtonsSkeleton />
                </div>
            </div>

            <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[#29292E] bg-[#111111]/90 px-4 backdrop-blur-md lg:hidden">
                <LoadingSkeleton className="h-10 w-10 rounded-lg" />
                <SidebarLogo />
                <div className="ml-auto flex items-center gap-1">
                    <LoadingSkeleton className="h-10 w-10 rounded-lg" />
                    <LoadingSkeleton className="h-10 w-10 rounded-lg" />
                </div>
            </header>

            <div className="flex lg:pl-60 xl:pl-64">
                <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <ExploreContentSkeleton />
                </main>
            </div>
        </div>
    );
}
