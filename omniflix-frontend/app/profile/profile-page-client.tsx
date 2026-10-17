"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ExploreLayout } from "@/components/explore/ExploreLayout";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { ProfileContent } from "@/components/profile/ProfileContent";
import { useAuth } from "@/components/auth/AuthProvider";
import type { MediaItem } from "@/lib/media";
import type { EntertainmentListType } from "@/service/types/profile.payload";

export default function ProfilePageClient() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const sourceRoute = searchParams.get("from");
    const validSourceRoutes = ["/explore", "/comics", "/novels", "/movies", "/series"];
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

    return (
        <ExploreLayout showBrowseSidebar={false}>
            <div className="flex min-h-[calc(100vh-3.5rem)] flex-col gap-8 lg:h-[calc(100vh-4rem)] lg:flex-row lg:gap-8">
                <aside className="w-full shrink-0 lg:fixed lg:top-[5vh] lg:left-8 lg:h-[90vh] lg:w-[300px]">
                    <div className="h-full overflow-y-auto rounded-xl border border-[#29292E] bg-[#171719] p-5">
                        <ProfileSidebar onSignOut={handleSignOut} />
                    </div>
                </aside>

                <div className="min-w-0 flex-1 lg:ml-[332px] lg:h-full lg:overflow-y-auto lg:pr-2">
                    {isLoading ? (
                        <div className="space-y-4" aria-hidden="true">
                            <div className="h-8 w-40 rounded bg-[#27272A] animate-pulse motion-reduce:animate-none" />
                            <div className="h-10 w-full max-w-2xl rounded-full bg-[#27272A] animate-pulse motion-reduce:animate-none" />
                            <div className="h-48 rounded-lg bg-[#27272A] animate-pulse motion-reduce:animate-none" />
                        </div>
                    ) : (
                        <>
                            <header className="mb-6">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[#F5F5F5] sm:text-3xl">
                                        {isGuest ? "Guest Profile" : "Profile"}
                                    </h1>
                                    <button
                                        type="button"
                                        onClick={() => router.push(returnRoute)}
                                        className="inline-flex min-h-10 shrink-0 items-center rounded-lg border border-[#29292E] px-3 text-sm text-[#A1A1AA] transition-colors hover:border-[#8B5CF6]/60 hover:bg-[#8B5CF6]/10 hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                                    >
                                        Go Back
                                    </button>
                                </div>
                                <p className="mt-1 text-sm text-[#A1A1AA] sm:text-base">
                                    {isGuest
                                        ? "You are browsing as a guest. Sign in to unlock collections and keep your history."
                                        : "Manage your collections and activity."}
                                </p>
                            </header>

                            {isGuest ? (
                                <ProfileContent isGuest guestHistory={guestHistory} />
                            ) : (
                                <ProfileContent
                                    isGuest={false}
                                    collections={emptyCollections}
                                    guestHistory={guestHistory}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </ExploreLayout>
    );
}
