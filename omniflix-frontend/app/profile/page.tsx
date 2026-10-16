"use client";

import { useRouter } from "next/navigation";
import { ExploreLayout } from "@/components/explore/ExploreLayout";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { ProfileContent } from "@/components/profile/ProfileContent";
import { useAuth } from "@/components/auth/AuthProvider";
import type { MediaItem } from "@/lib/media";
import type { EntertainmentListType } from "@/service/types/profile.payload";

/**
 * Profile page — works for guests and authenticated users. Guests are NOT
 * redirected; they see the guest profile experience (History only in the main
 * content). No profile/history API exists yet, so authenticated collections
 * render empty states and guest history is an empty prepared state.
 */
export default function ProfilePage() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();

    function handleSignOut() {
        void logout().then(() => router.push("/"));
    }

    const isGuest = !isAuthenticated || user === null;

    /**
     * Until the collections API exists, every collection is empty. Built from
     * the EntertainmentListType union so a new collection cannot be forgotten.
     * TODO: replace with React Query hooks against the collections API.
     */
    const emptyCollections = {} as Record<
        EntertainmentListType,
        Partial<Record<MediaItem["type"], MediaItem[]>>
    >;

    const guestHistory: MediaItem[] = [];

    return (
        <ExploreLayout>
            <div className="flex flex-col gap-8 lg:flex-row lg:gap-8">
                {/* ── Profile sidebar (auth: avatar/name/history/controls; guest: sign-in) ── */}
                <aside className="w-full shrink-0 lg:w-72">
                    <div className="rounded-xl border border-[#29292E] bg-[#171719] p-5 lg:sticky lg:top-8">
                        <ProfileSidebar onSignOut={handleSignOut} />
                    </div>
                </aside>

                {/* ── Main content ── */}
                <div className="min-w-0 flex-1">
                    {isLoading ? (
                        <div className="space-y-4" aria-hidden="true">
                            <div className="h-8 w-40 rounded bg-[#27272A] animate-pulse motion-reduce:animate-none" />
                            <div className="h-10 w-full max-w-2xl rounded-full bg-[#27272A] animate-pulse motion-reduce:animate-none" />
                            <div className="h-48 rounded-lg bg-[#27272A] animate-pulse motion-reduce:animate-none" />
                        </div>
                    ) : (
                        <>
                            <header className="mb-6">
                                <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[#F5F5F5] sm:text-3xl">
                                    {isGuest ? "Guest Profile" : "Profile"}
                                </h1>
                                <p className="mt-1 text-sm text-[#A1A1AA] sm:text-base">
                                    {isGuest
                                        ? "You are browsing as a guest. Sign in to unlock collections and keep your history."
                                        : "Manage your collections and activity."}
                                </p>
                            </header>

                            {isGuest ? (
                                <ProfileContent
                                    isGuest
                                    guestHistory={guestHistory}
                                />
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
