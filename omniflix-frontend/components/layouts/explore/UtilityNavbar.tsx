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

    const buttonClasses =
        "inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]";

    return (
        <div className="sticky top-0 z-40 hidden border-b border-[#29292E] bg-[#111111]/90 px-4 py-2 backdrop-blur-md lg:block xl:hidden">
            <div className="flex items-center justify-end gap-1">
                {/* Search */}
                <div className="relative">
                    <button
                        type="button"
                        aria-label="Search"
                        aria-expanded={isSearchOpen}
                        onClick={() => {
                            setIsSearchOpen((open) => !open);
                            setIsNotificationsOpen(false);
                        }}
                        className={`${buttonClasses} text-[#A1A1AA] hover:bg-[#242429] hover:text-[#F5F5F5] ${isSearchOpen ? "bg-[#8B5CF6]/15 text-[#A78BFA]" : ""}`}
                    >
                        <SearchIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button
                        type="button"
                        aria-label="Notifications"
                        aria-expanded={isNotificationsOpen}
                        onClick={() => {
                            setIsNotificationsOpen((open) => !open);
                            setIsSearchOpen(false);
                        }}
                        className={`${buttonClasses} text-[#A1A1AA] hover:bg-[#242429] hover:text-[#F5F5F5] ${isNotificationsOpen ? "bg-[#8B5CF6]/15 text-[#A78BFA]" : ""}`}
                    >
                        <BellIcon className="h-5 w-5" />
                    </button>

                    {isNotificationsOpen && (
                        <div
                            role="dialog"
                            aria-label="Notifications"
                            className="absolute left-0 top-13 z-50 w-80 rounded-xl border border-[#29292E] bg-[#171719] p-4 shadow-xl"
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
                    className={`${buttonClasses} text-[#A1A1AA] hover:bg-[#242429] hover:text-[#F5F5F5]`}
                >
                    <LibraryIcon className="h-5 w-5" />
                </button>
            </div>

            {isSearchOpen && (
                <div className="pt-2 pb-1">{searchContent}</div>
            )}
        </div>
    );
}

/** Placeholder panel content until the notifications API exists. */
export function NotificationsPlaceholder() {
    return (
        <div className="relative">
            <p className="text-sm font-medium text-[#F5F5F5]">Notifications</p>
            <p className="mt-2 text-xs text-[#A1A1AA]">
                Notifications arrive with the notifications API.
            </p>
            <button
                type="button"
                aria-label="Close notifications"
                className="absolute -top-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#A1A1AA] hover:bg-[#242429] hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
            >
                <CloseIcon className="h-4 w-4" />
            </button>
        </div>
    );
}
