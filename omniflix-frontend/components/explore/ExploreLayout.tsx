"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import {
    SidebarLogo,
    SidebarNavigation,
    AccountNavigation,
} from "./SidebarNavigation";
import {
    MenuIcon,
    CloseIcon,
    BellIcon,
    SearchIcon,
} from "@/components/icons/icons";

interface ExploreLayoutProps {
    /** Center column content. */
    children: ReactNode;
    /** Right sidebar utilities + popular lists. */
    utilities?: ReactNode;
    popular?: ReactNode;
}

/**
 * Three-column shell (sidebar / main / utilities). The right sidebar hides
 * below xl and reappears as part of the mobile drawer; the left sidebar
 * becomes a slide-in drawer below lg. Single implementation, responsive CSS.
 */
export function ExploreLayout({ children, utilities, popular }: ExploreLayoutProps) {
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Close the drawer on Escape and lock scroll while open.
    useEffect(() => {
        if (!isDrawerOpen) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") setIsDrawerOpen(false);
        }
        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isDrawerOpen]);

    async function handleSignOut() {
        await logout();
        setIsDrawerOpen(false);
        router.push("/");
    }

    const sidebarContent = (onNavigate?: () => void) => (
        <div className="flex h-full flex-col">
            <div className="px-2 pt-1 pb-6">
                <SidebarLogo />
            </div>

            <div className="flex-1 space-y-6">
                <SidebarNavigation onNavigate={onNavigate} />
            </div>

            <div className="mt-8 border-t border-[#29292E] pt-5 pb-2">
                <AccountNavigation
                    isAuthenticated={isAuthenticated}
                    username={user?.username}
                    onSignOut={handleSignOut}
                    onNavigate={onNavigate}
                />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#111111] text-[#F5F5F5]">
            {/* ── Desktop left sidebar (hidden below lg) ── */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-[#29292E] bg-[#171719] px-4 py-4 lg:block xl:w-64">
                {sidebarContent()}
            </aside>

            {/* ── Mobile top header (lg and below) ── */}
            <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[#29292E] bg-[#111111]/90 px-4 backdrop-blur-md lg:hidden">
                <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    aria-label="Open navigation menu"
                    aria-expanded={isDrawerOpen}
                    aria-controls="mobile-nav-drawer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#F5F5F5] transition-colors hover:bg-[#242429] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                >
                    <MenuIcon className="h-5 w-5" />
                </button>
                <SidebarLogo />
                <div className="ml-auto flex items-center gap-1">
                    <button
                        type="button"
                        aria-label="Notifications"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#A1A1AA] transition-colors hover:bg-[#242429] hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                    >
                        <BellIcon className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        aria-label="Search"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#A1A1AA] transition-colors hover:bg-[#242429] hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                    >
                        <SearchIcon className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {/* ── Mobile drawer ── */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
                    <button
                        type="button"
                        aria-label="Close navigation menu"
                        onClick={() => setIsDrawerOpen(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <div
                        id="mobile-nav-drawer"
                        className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto border-r border-[#29292E] bg-[#171719] px-4 py-5 shadow-xl"
                    >
                        <div className="relative flex h-full min-h-full flex-col">
                            {sidebarContent(() => setIsDrawerOpen(false))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsDrawerOpen(false)}
                            aria-label="Close navigation menu"
                            className="absolute top-5 right-3 inline-flex h-11 w-11 items-center justify-center rounded-lg text-[#A1A1AA] hover:bg-[#242429] hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                        >
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Main content ── */}
            <div className="flex lg:pl-60 xl:pl-64">
                <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    {children}
                </main>

                {/* ── Right sidebar (xl and up) ── */}
                {(utilities !== undefined || popular !== undefined) && (
                    <aside className="hidden w-80 shrink-0 border-l border-[#29292E] bg-[#171719]/50 px-5 py-8 xl:block">
                        {utilities}
                        {popular !== undefined && (
                            <div className="mt-8 space-y-8 border-t border-[#29292E] pt-6">
                                {popular}
                            </div>
                        )}
                    </aside>
                )}
            </div>
        </div>
    );
}
