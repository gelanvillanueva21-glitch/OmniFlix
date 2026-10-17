"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { ProfileContent } from "@/components/profile/ProfileContent";
import { useAuth } from "@/components/auth/AuthProvider";
import { ChevronLeftIcon } from "@/components/icons/icons";
import type { MediaItem } from "@/lib/media";
import type { EntertainmentListType } from "@/service/types/profile.payload";

const validSourceRoutes = ["/explore", "/comics", "/novels", "/movies", "/series"];

export default function ProfilePageClient() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mobileView, setMobileView] = useState<"profile" | "library">("profile");
    const [selectedCollection, setSelectedCollection] =
        useState<EntertainmentListType>("FAVORITE");

    const sourceRoute = searchParams.get("from");
    const returnRoute = validSourceRoutes.some(
        (route) => sourceRoute === route || sourceRoute?.startsWith(`${route}/`),
    )
        ? sourceRoute!
        : "/explore";

    function handleSignOut() {
        void logout().then(() => router.push("/"));
    }

    const isGuest = !isAuthenticated || user === null;
    const emptyCollections = {} as Record<
        EntertainmentListType,
        Partial<Record<MediaItem["type"], MediaItem[]>>
    >;
    const guestHistory: MediaItem[] = [];

    const profileSidebar = (
        <ProfileSidebar
            onSignOut={handleSignOut}
            onOpenLibrary={!isGuest ? () => setMobileView("library") : undefined}
        />
    );

    const profileContent = isGuest ? (
        <ProfileContent isGuest guestHistory={guestHistory} />
    ) : (
        <ProfileContent
            isGuest={false}
            collections={emptyCollections}
            guestHistory={guestHistory}
            selectedCollection={selectedCollection}
            onCollectionChange={setSelectedCollection}
        />
    );

    if (isLoading) {
        return (
            <main className="min-h-[100dvh] bg-[#111111] p-6 text-[#F5F5F5] lg:p-10">
                <div className="mx-auto max-w-3xl space-y-4" aria-hidden="true">
                    <div className="h-8 w-40 animate-pulse rounded bg-[#27272A] motion-reduce:animate-none" />
                    <div className="h-48 animate-pulse rounded-lg bg-[#27272A] motion-reduce:animate-none" />
                </div>
            </main>
        );
    }

    return (
        <main className="h-[100dvh] overflow-hidden bg-[#111111] text-[#F5F5F5]">
            <section className="flex h-full flex-col lg:hidden">
                {mobileView === "profile" ? (
                    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
                        <button
                            type="button"
                            onClick={() => router.push(returnRoute)}
                            className="absolute top-5 right-5 z-10 inline-flex min-h-10 items-center rounded-lg border border-[#29292E] px-3 text-sm text-[#A1A1AA] transition-colors hover:border-[#8B5CF6]/60 hover:bg-[#8B5CF6]/10 hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] sm:top-7 sm:right-8"
                        >
                            Go Back
                        </button>
                        {profileSidebar}
                    </div>
                ) : (
                    <div className="flex min-h-0 flex-1 flex-col">
                        <header className="sticky top-0 z-20 flex min-h-16 shrink-0 items-center gap-3 border-b border-[#29292E] bg-[#111111]/95 px-4 backdrop-blur-md sm:px-6">
                            <button
                                type="button"
                                onClick={() => setMobileView("profile")}
                                aria-label="Back to Profile"
                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#A1A1AA] transition-colors hover:bg-[#242429] hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                            >
                                <ChevronLeftIcon className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold">Library</h1>
                                <p className="text-xs text-[#A1A1AA]">Your collections</p>
                            </div>
                        </header>
                        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
                            <ProfileContent
                                isGuest={false}
                                collections={emptyCollections}
                                guestHistory={guestHistory}
                                selectedCollection={selectedCollection}
                                onCollectionChange={setSelectedCollection}
                                mobileLibrary
                            />
                        </div>
                    </div>
                )}
            </section>

            <section className="hidden h-full lg:flex">
                <aside className="fixed inset-y-0 left-0 z-10 w-[280px] border-r border-[#29292E] bg-[#171719] p-5 xl:w-[300px]">
                    {profileSidebar}
                </aside>
                <div className="ml-[280px] min-w-0 flex-1 overflow-y-auto xl:ml-[300px]">
                    <div className="mx-auto w-full max-w-6xl px-8 py-10 xl:px-12">
                        <header className="mb-8 flex items-start justify-between gap-4">
                            <div>
                                <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold">
                                    {isGuest ? "Guest Profile" : "Profile"}
                                </h1>
                                <p className="mt-1 text-base text-[#A1A1AA]">
                                    {isGuest
                                        ? "You are browsing as a guest. Sign in to unlock collections and keep your history."
                                        : "Manage your collections and activity."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.push(returnRoute)}
                                className="inline-flex min-h-10 shrink-0 items-center rounded-lg border border-[#29292E] px-3 text-sm text-[#A1A1AA] transition-colors hover:border-[#8B5CF6]/60 hover:bg-[#8B5CF6]/10 hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                            >
                                Go Back
                            </button>
                        </header>
                        {profileContent}
                    </div>
                </div>
            </section>
        </main>
    );
}
