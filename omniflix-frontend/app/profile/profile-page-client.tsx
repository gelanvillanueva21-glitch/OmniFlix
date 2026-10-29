"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProfileSidebar } from "@/components/layouts/profile/ProfileSidebar";
import { ProfileContent } from "@/components/layouts/profile/ProfileContent";
import { ProfileSkeleton } from "@/components/layouts/profile/ProfileSkeleton";
import { SidebarLogo } from "@/components/SidebarLogo";
import { useAuth } from "@/components/AuthProvider";
import {
    ChevronLeftIcon,
    CloseIcon,
    MenuIcon,
    UserIcon,
} from "@/components/icons/icons";
import {
    getActivityHistory,
    getEntertainmentCollection,
    getProfile,
    getSearchHistory,
    groupEntertainmentItems,
    mapHistoryToMediaItems,
} from "@/service/profile.service";
import type { MediaItem } from "@/lib/media";
import type { EntertainmentListType } from "@/service/types/profile.payload";

const validSourceRoutes = ["/explore", "/comics", "/novels", "/movies", "/series"];

export default function ProfilePageClient() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mobileView, setMobileView] = useState<"profile" | "library">("profile");
    const [isTabletDrawerOpen, setIsTabletDrawerOpen] = useState(false);
    const tabletDrawerCloseRef = useRef<HTMLButtonElement>(null);
    const [selectedCollection, setSelectedCollection] =
        useState<EntertainmentListType>("FAVORITE");

    useEffect(() => {
        if (!isTabletDrawerOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsTabletDrawerOpen(false);
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";
        tabletDrawerCloseRef.current?.focus();

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [isTabletDrawerOpen]);

    const queryEnabled = !isLoading && isAuthenticated && user !== null;
    const profileQuery = useQuery({
        queryKey: ["profile", "info"],
        queryFn: getProfile,
        enabled: queryEnabled,
        retry: false,
    });
    const collectionQuery = useQuery({
        queryKey: ["profile", "collections", selectedCollection],
        queryFn: () => getEntertainmentCollection(selectedCollection),
        enabled: queryEnabled,
        retry: false,
    });
    const activityQuery = useQuery({
        queryKey: ["profile", "activity"],
        queryFn: getActivityHistory,
        enabled: queryEnabled,
        retry: false,
    });
    useQuery({
        queryKey: ["profile", "search-history"],
        queryFn: getSearchHistory,
        enabled: queryEnabled,
        retry: false,
    });

    const sourceRoute = searchParams.get("from");
    const returnRoute = validSourceRoutes.some(
        (route) => sourceRoute === route || sourceRoute?.startsWith(`${route}/`),
    )
        ? sourceRoute!
        : "/explore";

    function handleSignOut() {
        setIsTabletDrawerOpen(false);
        void logout().then(() => router.push("/"));
    }

    function handleGoBack() {
        setIsTabletDrawerOpen(false);
        router.push(returnRoute);
    }

    const isGuest = !isAuthenticated || user === null;
    const collections = groupEntertainmentItems(collectionQuery.data ?? []);
    const guestHistory: MediaItem[] = [];
    const recentActivity = mapHistoryToMediaItems(activityQuery.data ?? []);
    const collectionError = getQueryErrorMessage(collectionQuery.error);
    const activityError = getQueryErrorMessage(activityQuery.error);

    const profileSidebar = (
        <ProfileSidebar
            onSignOut={handleSignOut}
            onGoBack={handleGoBack}
            onOpenLibrary={!isGuest ? () => setMobileView("library") : undefined}
            profile={profileQuery.data}
            recentActivity={recentActivity}
            isActivityLoading={activityQuery.isLoading}
            activityError={activityError}
            onRetryActivity={() => void activityQuery.refetch()}
        />
    );

    const profileContent = isGuest ? (
        <ProfileContent isGuest guestHistory={guestHistory} />
    ) : (
        <ProfileContent
            isGuest={false}
            collections={collections}
            guestHistory={guestHistory}
            selectedCollection={selectedCollection}
            onCollectionChange={setSelectedCollection}
            isCollectionLoading={collectionQuery.isLoading}
            collectionError={collectionError}
            onRetryCollection={() => void collectionQuery.refetch()}
        />
    );

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    return (
        <main className="fixed inset-0 overflow-hidden bg-[#111111] text-[#F5F5F5]">
            <section className="flex h-full flex-col min-[650px]:hidden lg:hidden">
                {mobileView === "profile" ? (
                    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 py-6 sm:px-8 sm:py-8">
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
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
                            <ProfileContent
                                isGuest={false}
                                collections={collections}
                                guestHistory={guestHistory}
                                selectedCollection={selectedCollection}
                                onCollectionChange={setSelectedCollection}
                                mobileLibrary
                                isCollectionLoading={collectionQuery.isLoading}
                                collectionError={collectionError}
                                onRetryCollection={() => void collectionQuery.refetch()}
                            />
                        </div>
                    </div>
                )}
            </section>

            <section className="hidden h-full flex-col min-[650px]:flex lg:hidden">
                <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-[#29292E] bg-[#111111]/95 px-5 backdrop-blur-md">
                    <button
                        type="button"
                        onClick={() => setIsTabletDrawerOpen(true)}
                        aria-label="Open profile menu"
                        aria-expanded={isTabletDrawerOpen}
                        aria-controls="tablet-profile-drawer"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#F5F5F5] transition-colors hover:bg-[#242429] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                    >
                        <MenuIcon className="h-5 w-5" />
                    </button>
                    <SidebarLogo />
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-7 sm:px-8 sm:py-8">
                    <div className="mx-auto w-full max-w-6xl">
                        <header className="mb-7 flex items-center gap-4">
                            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6]/15 text-[#A78BFA]">
                                <UserIcon className="h-6 w-6" />
                            </span>
                            <div className="min-w-0">
                                <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
                                    My Profile
                                </h1>
                                <p className="truncate text-sm text-[#A1A1AA]">
                                    {isGuest
                                        ? "Guest"
                                        : profileQuery.data?.displayName ?? user?.username}
                                </p>
                            </div>
                        </header>
                        {profileContent}
                    </div>
                </div>

                {isTabletDrawerOpen && (
                    <div
                        className="fixed inset-0 z-50"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Profile menu"
                    >
                        <button
                            type="button"
                            aria-label="Close profile menu"
                            onClick={() => setIsTabletDrawerOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <aside
                            id="tablet-profile-drawer"
                            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto border-r border-[#29292E] bg-[#171719] p-5 shadow-xl"
                        >
                            <div className="flex items-center justify-between px-2 pb-6">
                                <SidebarLogo />
                                <button
                                    ref={tabletDrawerCloseRef}
                                    type="button"
                                    onClick={() => setIsTabletDrawerOpen(false)}
                                    aria-label="Close profile menu"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#A1A1AA] hover:bg-[#242429] hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                                >
                                    <CloseIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="h-[calc(100%-4rem)]">
                                <ProfileSidebar
                                    onSignOut={handleSignOut}
                                    onGoBack={handleGoBack}
                                    onNavigate={() => setIsTabletDrawerOpen(false)}
                                    showLogo={false}
                                    profile={profileQuery.data}
                                    recentActivity={recentActivity}
                                    isActivityLoading={activityQuery.isLoading}
                                    activityError={activityError}
                                    onRetryActivity={() => void activityQuery.refetch()}
                                />
                            </div>
                        </aside>
                    </div>
                )}
            </section>

            <section className="hidden h-full lg:flex">
                <aside className="fixed inset-y-0 left-0 z-10 w-[280px] border-r border-[#29292E] bg-[#171719] p-5 xl:w-[300px]">
                    {profileSidebar}
                </aside>
                <div className="ml-[280px] min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain xl:ml-[300px]">
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
                        </header>
                        {profileContent}
                    </div>
                </div>
            </section>
        </main>
    );
}

function getQueryErrorMessage(error: unknown): string | undefined {
    if (error == null) {
        return undefined;
    }

    return error instanceof Error
        ? error.message
        : "Unable to load profile data.";
}
