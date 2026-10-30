"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProfileSidebar } from "@/components/layouts/profile/ProfileSidebar";
import { ProfileContent } from "@/components/layouts/profile/ProfileContent";
import { ProfileSkeleton } from "@/components/layouts/profile/ProfileSkeleton";
import { ChangePasswordWindow } from "@/components/layouts/profile/ChangePassword";
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
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

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
            onOpenChangePassword={
                !isGuest
                    ? () => {
                          setIsTabletDrawerOpen(false);
                          setMobileView("profile");
                          setIsChangePasswordOpen(true);
                      }
                    : undefined
            }
            onGoBack={handleGoBack}
            onOpenLibrary={!isGuest ? () => setMobileView("library") : undefined}
            showLogo={isTabletDrawerOpen ? false : true}
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
        <main className="profile-page-shell">
            {isChangePasswordOpen && (
                <ChangePasswordWindow onClose={() => setIsChangePasswordOpen(false)} />
            )}
            <section className="profile-mobile-view">
                {mobileView === "profile" ? (
                    <div className="profile-mobile-scroll">
                        {profileSidebar}
                    </div>
                ) : (
                    <div className="profile-library-view">
                        <header className="profile-library-header">
                            <button
                                type="button"
                                onClick={() => setMobileView("profile")}
                                aria-label="Back to Profile"
                                className="profile-library-back"
                            >
                                <ChevronLeftIcon className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="profile-library-title">Library</h1>
                                <p className="profile-library-subtitle">Your collections</p>
                            </div>
                        </header>
                        <div className="profile-library-scroll">
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

            <section className="profile-tablet-view">
                <header className="profile-tablet-header">
                    <button
                        type="button"
                        onClick={() => setIsTabletDrawerOpen(true)}
                        aria-label="Open profile menu"
                        aria-expanded={isTabletDrawerOpen}
                        aria-controls="tablet-profile-drawer"
                        className="profile-tablet-menu-button"
                    >
                        <MenuIcon className="h-5 w-5" />
                    </button>
                    <SidebarLogo />
                </header>

                <div className="profile-tablet-scroll">
                    <div className="profile-tablet-container">
                        <header className="profile-tablet-hero">
                            <span className="profile-tablet-hero-avatar">
                                <UserIcon className="profile-tablet-hero-avatar-icon" />
                            </span>
                            <div className="profile-tablet-hero-caption">
                                <h1 className="profile-tablet-hero-title">
                                    My Profile
                                </h1>
                                <p className="profile-tablet-hero-name">
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
                        className="profile-tablet-drawer-wrapper"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Profile menu"
                    >
                        <button
                            type="button"
                            aria-label="Close profile menu"
                            onClick={() => setIsTabletDrawerOpen(false)}
                            className="explore-overlay-backdrop"
                        />
                        <aside
                            id="tablet-profile-drawer"
                            className="profile-tablet-drawer"
                        >
                            <div className="profile-tablet-drawer-head">
                                <SidebarLogo />
                                <button
                                    ref={tabletDrawerCloseRef}
                                    type="button"
                                    onClick={() => setIsTabletDrawerOpen(false)}
                                    aria-label="Close profile menu"
                                    className="profile-tablet-drawer-close"
                                >
                                    <CloseIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="profile-tablet-drawer-body">
                                {profileSidebar}
                            </div>
                        </aside>
                    </div>
                )}
            </section>

            <section className="profile-desktop-view">
                <aside className="profile-desktop-sidebar">
                    {profileSidebar}
                </aside>
                <div className="profile-desktop-scroll">
                    <div className="profile-desktop-container">
                        <header className="profile-desktop-hero">
                            <div>
                                <h1 className="profile-desktop-hero-title">
                                    {isGuest ? "Guest Profile" : "Profile"}
                                </h1>
                                <p className="profile-desktop-hero-subtitle">
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
