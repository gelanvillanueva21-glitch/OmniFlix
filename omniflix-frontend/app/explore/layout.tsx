"use client";

import { useEffect, useState, Suspense, type ReactNode } from "react";
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
        <div className="explore-sidebar-body">
            <div className="explore-sidebar-logo-slot">
                <SidebarLogo />
            </div>

            <div className="explore-sidebar-main">
                <Suspense fallback={<div className="explore-nav" />}>
                    <SidebarNavigation onNavigate={onNavigate} />
                </Suspense>
            </div>

            <div className="explore-sidebar-account">
                <Suspense fallback={<div className="explore-nav-heading-group" />}>
                    <AccountNavigation
                        isAuthenticated={isAuthenticated}
                        username={user?.username}
                        onSignOut={onSignOut}
                        onNavigate={onNavigate}
                    />
                </Suspense>
            </div>
        </div>
    );

    return (
        <div className="explore-shell">
            <aside className="explore-shell-sidebar">
                {sidebarContent()}
            </aside>

            <header className="explore-shell-header">
                <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    aria-label="Open navigation menu"
                    aria-expanded={isDrawerOpen}
                    aria-controls="mobile-nav-drawer"
                    className="explore-shell-header-menu-button"
                >
                    <MenuIcon className="h-5 w-5" />
                </button>
                <SidebarLogo />
                <div className="explore-shell-header-actions">
                    <button
                        type="button"
                        aria-label="Notifications"
                        className="explore-shell-header-icon-button"
                    >
                        <BellIcon className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        aria-label="Search"
                        className="explore-shell-header-icon-button"
                    >
                        <SearchIcon className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {isDrawerOpen && (
                <div className="explore-shell-drawer-overlay-wrapper" role="dialog" aria-modal="true" aria-label="Navigation menu">
                    <button
                        type="button"
                        aria-label="Close navigation menu"
                        onClick={() => setIsDrawerOpen(false)}
                        className="explore-overlay-backdrop"
                    />
                    <div
                        id="mobile-nav-drawer"
                        className="explore-shell-drawer"
                    >
                        <div className="explore-shell-drawer-inner">
                            {sidebarContent(() => setIsDrawerOpen(false))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsDrawerOpen(false)}
                            aria-label="Close navigation menu"
                            className="explore-shell-drawer-close"
                        >
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}

            <div className="explore-shell-content">
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
