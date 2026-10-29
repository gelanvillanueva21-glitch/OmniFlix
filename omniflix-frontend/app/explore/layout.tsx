"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
    SidebarNavigation,
    AccountNavigation,
} from "@/components/layouts/explore/SidebarNavigation";
import { SidebarLogo } from "@/components/SidebarLogo";
import {
    MenuIcon,
    CloseIcon,
    BellIcon,
    SearchIcon,
} from "@/components/icons/icons";

export default function ExploreLayout({ children }: { children: ReactNode }) {
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    return (
        <ExploreShell
            user={user}
            isAuthenticated={isAuthenticated}
            onSignOut={async () => {
                await logout();
                router.push("/");
            }}
        >
            {children}
        </ExploreShell>
    );
}

function ExploreShell({
    children,
    user,
    isAuthenticated,
    onSignOut,
}: {
    children: ReactNode;
    user: { username?: string } | null;
    isAuthenticated: boolean;
    onSignOut: () => void;
}) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useDismissableOverlay(isDrawerOpen, () => setIsDrawerOpen(false));

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
                    onSignOut={onSignOut}
                    onNavigate={onNavigate}
                />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#111111] text-[#F5F5F5]">
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-[#29292E] bg-[#171719] px-4 py-4 lg:block xl:w-64">
                {sidebarContent()}
            </aside>

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

            <div className="lg:pl-60 xl:pl-64">
                {children}
            </div>
        </div>
    );
}

function useDismissableOverlay(isOpen: boolean, onClose: () => void) {
    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") onClose();
        }

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);
}
