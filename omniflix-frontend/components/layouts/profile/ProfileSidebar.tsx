"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { SidebarLogo } from "@/components/SidebarLogo";
import { EmptyState, ErrorState } from "@/components/SectionHeader";
import type { MediaItem } from "@/lib/media";
import type { ProfileResponse } from "@/service/types/profile.payload";
import {
    UserIcon,
    LogOutIcon,
} from "@/components/icons/icons";

interface ProfileSidebarProps {
    readonly onSignOut: () => void;
    /** Opens the Change Password window (rendered by the profile page). */
    readonly onOpenChangePassword?: () => void;
    readonly onGoBack?: () => void;
    readonly onOpenLibrary?: () => void;
    readonly onNavigate?: () => void;
    readonly showLogo?: boolean;
    readonly profile?: ProfileResponse | null;
    readonly recentActivity?: MediaItem[];
    readonly isActivityLoading?: boolean;
    readonly activityError?: string;
    readonly onRetryActivity?: () => void;
}

/**
 * Profile page left sidebar. Authenticated: avatar, name, History box,
 * Change Password + Sign Out. Guest:
 * avatar, "Guest", Sign In/Up, benefits message — no History box.
 */
export function ProfileSidebar({
    onSignOut,
    onOpenChangePassword,
    onGoBack,
    onOpenLibrary,
    onNavigate,
    showLogo = true,
    profile,
    recentActivity = [],
    isActivityLoading = false,
    activityError,
    onRetryActivity,
}: ProfileSidebarProps) {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="explore-sidebar-body">
                {showLogo && (
                    <div className="explore-sidebar-logo-slot">
                        <SidebarLogo />
                    </div>
                )}
                <div className="profile-sidebar-loading" aria-hidden="true">
                    <div className="profile-sidebar-skeleton-avatar" />
                    <div className="profile-sidebar-skeleton-name" />
                    <div className="profile-sidebar-skeleton-box" />
                </div>
            </div>
        );
    }

    if (!isAuthenticated || user === null) {
        return (
            <div className="explore-sidebar-body">
                {showLogo && (
                    <div className="explore-sidebar-logo-slot">
                        <SidebarLogo />
                    </div>
                )}

                <div className="profile-sidebar-guest">
                    <div className="profile-sidebar-guest-identity">
                        <span className="profile-sidebar-guest-avatar">
                            <UserIcon className="profile-sidebar-guest-avatar-icon" />
                        </span>
                        <p className="profile-sidebar-guest-name">Guest</p>
                    </div>

                    <p className="profile-sidebar-guest-note">
                        Sign in or create an account to save favorites, build your
                        watchlist, and organize your entertainment.
                    </p>

                    <div className="profile-history-box profile-history-box--mobile-only">
                        <p className="profile-history-heading">
                            History
                        </p>
                        {recentActivity.length === 0 ? (
                            <div className="profile-history-empty">
                                <EmptyState
                                    title="No recent activity yet"
                                    description="Sign in to keep track of your activity."
                                />
                            </div>
                        ) : (
                            <ul className="profile-history-list">
                                {recentActivity.slice(0, 5).map((item) => (
                                    <li
                                        key={item.id}
                                        className="profile-history-list-item"
                                        title={item.title}
                                    >
                                        {item.title}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="profile-sidebar-footer">
                        <Link
                            href="/auth/signin"
                            onClick={onNavigate}
                            className="profile-sidebar-signin"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/auth/signup"
                            onClick={onNavigate}
                            className="profile-sidebar-signup"
                        >
                            Sign Up
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="explore-sidebar-body">
            {showLogo && (
                <div className="px-2 pt-1 pb-6">
                    <SidebarLogo />
                </div>
            )}

            <div className="explore-sidebar-loading">
                {/* Avatar + name (UserResponse has no profile picture or display
                    name yet — fallback: username + default avatar icon) */}
                <div className="profile-sidebar-identity">
                    <span className="profile-sidebar-avatar">
                        <UserIcon className="profile-sidebar-avatar-icon" />
                    </span>
                    <div className="profile-sidebar-name-slot">
                        <p className="profile-sidebar-name">
                            {profile?.displayName ?? user.username}
                        </p>
                    </div>
                </div>

                <div className="profile-history-box">
                    <p className="profile-history-heading">
                        History
                    </p>
                    {isActivityLoading ? (
                        <p className="profile-history-loading-text" role="status">
                            Loading recent activity...
                        </p>
                    ) : activityError ? (
                        <ErrorState
                            message={activityError}
                            onRetry={onRetryActivity}
                        />
                    ) : recentActivity.length === 0 ? (
                        <div className="profile-history-loading">
                            <EmptyState
                                title="No recent activity yet"
                                description="Titles you open will appear here."
                            />
                        </div>
                    ) : (
                        <ul className="profile-history-list">
                            {recentActivity.slice(0, 5).map((item) => (
                                <li
                                    key={item.id}
                                    className="profile-history-list-item"
                                    title={item.title}
                                >
                                    {item.title}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {onOpenLibrary && (
                    <button
                        type="button"
                        onClick={onOpenLibrary}
                        className="profile-sidebar-library-button"
                    >
                        Open Library
                    </button>
                )}

                <div className="profile-sidebar-footer">
                    {onGoBack && (
                        <button
                            type="button"
                            onClick={onGoBack}
                            className="profile-sidebar-action"
                        >
                            Go Back
                        </button>
                    )}
                    {/* Change Password opens the modal window rendered by the
                        profile page (state lives there). */}
                    <button
                        type="button"
                        onClick={onOpenChangePassword}
                        className="profile-sidebar-action profile-sidebar-action--pointer"
                    >
                        Change Password
                    </button>
                    <button
                        type="button"
                        onClick={onSignOut}
                        className="profile-sidebar-action"
                    >
                        <LogOutIcon className="profile-sidebar-action-icon" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
