"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { SidebarLogo } from "@/components/SidebarLogo";
import { EmptyState, ErrorState } from "@/components/SectionHeader";
import type { MediaItem } from "@/lib/media";
import {
    UserIcon,
    LogOutIcon,
    PencilIcon,
    CameraIcon,
} from "@/components/icons/icons";
import { ProfileAuthResponse } from "@/service/types/profile.auth.payload";
import { MediaCarousel } from "@/components/MediaCarousel";

/** Matches the backend picture upload validation (5 MB). */
const MAX_PROFILE_PICTURE_BYTES = 5 * 1024 * 1024;
/** Matches the backend display name validation (50 characters). */
const MAX_DISPLAY_NAME_LENGTH = 50;
/** Image formats accepted by the backend picture upload. */
const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/jpg,image/png,image/gif,image/webp";

interface ProfileSidebarProps {
    readonly onSignOut: () => void;
    /** Opens the Change Password window (rendered by the profile page). */
    readonly onOpenChangePassword?: () => void;
    readonly onGoBack?: () => void;
    readonly onOpenLibrary?: () => void;
    readonly onNavigate?: () => void;
    readonly showLogo?: boolean;
    readonly profile?: ProfileAuthResponse | null;
    readonly recentActivity?: MediaItem[];
    /** Guest history from localStorage — shown when recentActivity is empty. */
    readonly guestHistory?: MediaItem[];
    readonly isActivityLoading?: boolean;
    readonly activityError?: string;
    readonly onRetryActivity?: () => void;
    /**
     * Persists profile edits. Returns the updated profile on success or an
     * error message on failure so the sidebar can keep editing state intact.
     */
    readonly onUpdateProfile?: (
        displayName: string | null,
        picture: File | null,
    ) => Promise<ProfileAuthResponse | null>;
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
    guestHistory = [],
    isActivityLoading = false,
    activityError,
    onRetryActivity,
    onUpdateProfile,
}: ProfileSidebarProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [displayNameDraft, setDisplayNameDraft] = useState("");
    const [pictureDraft, setPictureDraft] = useState<File | null>(null);
    const [picturePreviewUrl, setPicturePreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const savedDisplayName = profile?.display_name ?? user?.username ?? "";
    const savedPictureUrl = profile?.profile_picture_url ?? null;
    const previewUrl = picturePreviewUrl ?? savedPictureUrl;

    /** Guests render the localStorage-backed history; users render the API one. */
    const displayActivity = recentActivity.length === 0 ? guestHistory : recentActivity;

    useEffect(() => {
        return () => {
            if (picturePreviewUrl) {
                URL.revokeObjectURL(picturePreviewUrl);
            }
        };
    }, [picturePreviewUrl]);

    function enterEditMode() {
        setDisplayNameDraft(savedDisplayName);
        setPictureDraft(null);
        setPicturePreviewUrl(null);
        setEditError(null);
        setIsEditing(true);
    }

    function cancelEditing() {
        setIsEditing(false);
    }

    function handlePictureSelection(
        event: React.ChangeEvent<HTMLInputElement>,
    ) {
        const selectedFile = event.target.files?.[0] ?? null;
        // Allow re-selecting the same file after a failed attempt.
        event.target.value = "";

        if (!selectedFile) {
            return;
        }

        if (!ACCEPTED_IMAGE_TYPES.split(",").includes(selectedFile.type)) {
            setEditError("Unsupported image format. Use JPG, PNG, GIF or WEBP.");
            return;
        }

        if (selectedFile.size > MAX_PROFILE_PICTURE_BYTES) {
            setEditError("Image is too large. Maximum size is 5 MB.");
            return;
        }

        if (picturePreviewUrl) {
            URL.revokeObjectURL(picturePreviewUrl);
        }
        setEditError(null);
        setPictureDraft(selectedFile);
        setPicturePreviewUrl(URL.createObjectURL(selectedFile));
    }

    async function handleSaveChanges() {
        if (!onUpdateProfile) {
            setIsEditing(false);
            return;
        }

        const trimmedName = displayNameDraft.trim();
        const nameChanged = trimmedName !== savedDisplayName;
        const pictureChanged = pictureDraft !== null;

        if (!trimmedName) {
            setEditError("Display name cannot be empty.");
            return;
        }

        if (trimmedName.length > MAX_DISPLAY_NAME_LENGTH) {
            setEditError(`Display name must be at most ${MAX_DISPLAY_NAME_LENGTH} characters.`);
            return;
        }

        if (!nameChanged && !pictureChanged) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        setEditError(null);

        const updatedProfile = await onUpdateProfile(
            nameChanged ? trimmedName : null,
            pictureChanged ? pictureDraft : null,
        );

        if (picturePreviewUrl) {
            URL.revokeObjectURL(picturePreviewUrl);
        }
        setIsSaving(false);

        if (updatedProfile === null) {
            setEditError("Could not save your changes. Please try again.");
            return;
        }

        setIsEditing(false);
    }

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
                        {displayActivity.length === 0 ? (
                            <div className="profile-history-empty">
                                <EmptyState
                                    title="No recent activity yet"
                                    description="Sign in to keep track of your activity."
                                />
                            </div>
                        ) : (
                            
                            <MediaCarousel
                                items={displayActivity.slice(0, 5)}
                                label="Recent Activity"
                            />
                        )}
                    </div>

                    <div className="profile-sidebar-footer">
                        <button
                            onClick={onGoBack}
                            className="profile-sidebar-signin"
                        >
                            Go Back
                        </button>
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
                {isEditing ? (
                    /* ── Edit mode: avatar upload + display name input ── */
                    <div className="profile-sidebar-identity">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            aria-label="Change profile picture"
                            className="profile-sidebar-avatar-button"
                            disabled={isSaving}
                        >
                            {previewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={previewUrl}
                                    alt="Profile picture preview"
                                    className="profile-sidebar-avatar-image"
                                />
                            ) : (
                                <UserIcon className="profile-sidebar-avatar-icon" />
                            )}
                            <span className="profile-sidebar-avatar-overlay">
                                <CameraIcon className="profile-sidebar-avatar-overlay-icon" />
                            </span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={ACCEPTED_IMAGE_TYPES}
                            onChange={handlePictureSelection}
                            className="profile-sidebar-file-input"
                            aria-hidden="true"
                            tabIndex={-1}
                        />

                        <div className="profile-sidebar-edit-controls">
                            <input
                                type="text"
                                value={displayNameDraft}
                                onChange={(event) =>
                                    setDisplayNameDraft(event.target.value)
                                }
                                maxLength={MAX_DISPLAY_NAME_LENGTH}
                                placeholder="Display name"
                                aria-label="Display name"
                                disabled={isSaving}
                                className="profile-sidebar-name-input"
                            />
                            {editError && (
                                <p className="profile-sidebar-edit-error" role="alert">
                                    {editError}
                                </p>
                            )}
                            <div className="profile-sidebar-edit-actions">
                                <button
                                    type="button"
                                    onClick={() => void handleSaveChanges()}
                                    disabled={isSaving}
                                    className="profile-sidebar-save-button"
                                >
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelEditing}
                                    disabled={isSaving}
                                    className="profile-sidebar-cancel-button"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── Default state: saved picture + name + edit button ── */
                    <div className="profile-sidebar-identity">
                        <span className="profile-sidebar-avatar">
                            {savedPictureUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={savedPictureUrl}
                                    alt=""
                                    className="profile-sidebar-avatar-image"
                                />
                            ) : (
                                <UserIcon className="profile-sidebar-avatar-icon" />
                            )}
                        </span>
                        <div className="profile-sidebar-name-slot">
                            <p className="profile-sidebar-name">
                                {savedDisplayName}
                            </p>
                        </div>
                        {onUpdateProfile && (
                            <button
                                type="button"
                                onClick={enterEditMode}
                                aria-label="Edit profile"
                                className="profile-sidebar-edit-button"
                            >
                                <PencilIcon className="profile-sidebar-edit-button-icon" />
                            </button>
                        )}
                    </div>
                )}

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
                    ) : displayActivity.length === 0 ? (
                        <div className="profile-history-loading">
                            <EmptyState
                                title="No recent activity yet"
                                description="Titles you open will appear here."
                            />
                        </div>
                    ) : (
                        <MediaCarousel
                            items={displayActivity.slice(0, 5)}
                            label="Recent Activity"
                        />
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
