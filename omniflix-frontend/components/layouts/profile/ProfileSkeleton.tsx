import { SidebarLogo } from "@/components/SidebarLogo";

const collectionTabWidths = ["w-24", "w-24", "w-24", "w-20", "w-32", "w-28", "w-20"];

function SkeletonBlock({ className }: { readonly className: string }) {
    return (
        <div
            className={`animate-pulse rounded bg-[#27272A] motion-reduce:animate-none ${className}`}
        />
    );
}

function SkeletonSidebar() {
    return (
        <div className="flex h-full flex-col" aria-hidden="true">
            <div className="px-2 pt-1 pb-6">
                <SidebarLogo />
            </div>

            <div className="mt-4 flex flex-1 flex-col space-y-5 px-2">
                <div className="flex items-center gap-3">
                    <SkeletonBlock className="h-16 w-16 shrink-0 rounded-full" />
                    <SkeletonBlock className="h-5 w-28" />
                </div>

                <div className="min-h-40 rounded-lg border border-[#29292E] bg-[#171719] p-4">
                    <SkeletonBlock className="h-3 w-16" />
                    <SkeletonBlock className="mt-4 h-16 w-full rounded-md" />
                </div>

                <SkeletonBlock className="h-12 w-full rounded-lg lg:hidden" />

                <div className="mt-auto flex flex-col gap-3 pt-8">
                    <SkeletonBlock className="h-5 w-24" />
                    <SkeletonBlock className="h-5 w-32" />
                    <SkeletonBlock className="h-5 w-24" />
                </div>
            </div>
        </div>
    );
}

function SkeletonMediaRow({ index }: { readonly index: number }) {
    return (
        <section className="space-y-4" aria-hidden="true">
            <SkeletonBlock className="h-6 w-48" />
            <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 4 }, (_, cardIndex) => (
                    <div
                        key={`${index}-${cardIndex}`}
                        className="w-36 shrink-0 space-y-2 sm:w-44"
                    >
                        <SkeletonBlock className="aspect-2/3 w-full rounded-lg" />
                        <SkeletonBlock className="h-4 w-4/5" />
                        <SkeletonBlock className="h-3 w-1/2" />
                    </div>
                ))}
            </div>
        </section>
    );
}

function SkeletonMainContent() {
    return (
        <div aria-hidden="true">
            <div className="mb-8 flex items-start justify-between gap-4">
                <div className="space-y-3">
                    <SkeletonBlock className="h-9 w-40" />
                    <SkeletonBlock className="h-5 w-72 max-w-full" />
                </div>
            </div>

            <SkeletonCollectionContent />
        </div>
    );
}

function SkeletonCollectionContent() {
    return (
        <>
            <nav className="mb-8 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {collectionTabWidths.map((width, index) => (
                    <SkeletonBlock
                        key={`${width}-${index}`}
                        className={`h-9 shrink-0 rounded-full ${width}`}
                    />
                ))}
            </nav>

            <div className="space-y-8">
                {[0, 1, 2, 3].map((index) => (
                    <SkeletonMediaRow key={index} index={index} />
                ))}
            </div>
        </>
    );
}

export function ProfileSkeleton() {
    return (
        <main
            className="fixed inset-0 overflow-hidden bg-[#111111] text-[#F5F5F5]"
            aria-label="Loading profile"
        >
            <section className="flex h-full flex-col min-[650px]:hidden lg:hidden">
                <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 py-6 sm:px-8 sm:py-8">
                    <SkeletonSidebar />
                </div>
            </section>

            <section className="hidden h-full flex-col min-[650px]:flex lg:hidden">
                <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#29292E] bg-[#111111]/95 px-5">
                    <SkeletonBlock className="h-10 w-10 rounded-lg" />
                    <SkeletonBlock className="h-8 w-28" />
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-7 sm:px-8 sm:py-8">
                    <div className="mx-auto w-full max-w-6xl">
                        <div className="mb-7 flex items-center gap-4" aria-hidden="true">
                            <SkeletonBlock className="h-14 w-14 shrink-0 rounded-full" />
                            <div className="space-y-2">
                                <SkeletonBlock className="h-7 w-40" />
                                <SkeletonBlock className="h-4 w-28" />
                            </div>
                        </div>
                        <SkeletonCollectionContent />
                    </div>
                </div>
            </section>

            <section className="hidden h-full lg:flex">
                <aside className="fixed inset-y-0 left-0 z-10 w-[280px] border-r border-[#29292E] bg-[#171719] p-5 xl:w-[300px]">
                    <SkeletonSidebar />
                </aside>
                <div className="ml-[280px] min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain xl:ml-[300px]">
                    <div className="mx-auto w-full max-w-6xl px-8 py-10 xl:px-12">
                        <SkeletonMainContent />
                    </div>
                </div>
            </section>
        </main>
    );
}
