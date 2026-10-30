"use client";

import { useState, type ReactNode } from "react";
import { BellIcon, CloseIcon, LibraryIcon, SearchIcon } from "@/components/icons/icons";

interface UtilityNavbarProps {
    /** Rendered in the collapsible search row (reuses the existing SearchBar). */
    readonly searchContent: ReactNode;
    /** Rendered inside the notifications popover. */
    readonly notificationsContent: ReactNode;
    /** Opens the Library drawer (existing popular-content sidebar). */
    readonly onOpenLibrary: () => void;
}

/**
 * Compact utility bar shown only in the lg–xl range (1024–1279px), where the
 * fixed left sidebar still fits but the xl right utilities sidebar is hidden.
 * Exposes Search, Notifications, and Library via three icon buttons; the
 * content it reveals is passed in from ExploreLayout so nothing is duplicated.
 */
export function UtilityNavbar({
    searchContent,
    notificationsContent,
    onOpenLibrary,
}: UtilityNavbarProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const buttonClasses = "utility-navbar-button";

    return (
        <div className="utility-navbar">
            <div className="utility-navbar-row">
                {/* Search */}
                <div className="utility-navbar-button-slot">
                    <button
                        type="button"
                        aria-label="Search"
                        aria-expanded={isSearchOpen}
                        onClick={() => {
                            setIsSearchOpen((open) => !open);
                            setIsNotificationsOpen(false);
                        }}
                        className={`${buttonClasses} utility-navbar-button--idle ${isSearchOpen ? "utility-navbar-button--open" : ""}`}
                    >
                        <SearchIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Notifications */}
                <div className="utility-navbar-button-slot">
                    <button
                        type="button"
                        aria-label="Notifications"
                        aria-expanded={isNotificationsOpen}
                        onClick={() => {
                            setIsNotificationsOpen((open) => !open);
                            setIsSearchOpen(false);
                        }}
                        className={`${buttonClasses} utility-navbar-button--idle ${isNotificationsOpen ? "utility-navbar-button--open" : ""}`}
                    >
                        <BellIcon className="h-5 w-5" />
                    </button>

                    {isNotificationsOpen && (
                        <div
                            role="dialog"
                            aria-label="Notifications"
                            className="utility-navbar-popover"
                        >
                            {notificationsContent}
                        </div>
                    )}
                </div>

                {/* Library */}
                <button
                    type="button"
                    aria-label="Open library"
                    aria-haspopup="dialog"
                    onClick={onOpenLibrary}
                    className={`${buttonClasses} utility-navbar-button--idle`}
                >
                    <LibraryIcon className="h-5 w-5" />
                </button>
            </div>

            {isSearchOpen && (
                <div className="utility-navbar-search-row">{searchContent}</div>
            )}
        </div>
    );
}

/** Placeholder panel content until the notifications API exists. */
export function NotificationsPlaceholder() {
    return (
        <div className="utility-navbar-placeholder">
            <p className="utility-navbar-placeholder-title">Notifications</p>
            <p className="utility-navbar-placeholder-note">
                Notifications arrive with the notifications API.
            </p>
            <button
                type="button"
                aria-label="Close notifications"
                className="utility-navbar-placeholder-close"
            >
                <CloseIcon className="h-4 w-4" />
            </button>
        </div>
    );
}
