"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CloseIcon } from "@/components/icons/icons";
import { UtilityNavbar, NotificationsPlaceholder } from "./UtilityNavbar";

interface ExploreLayoutProps {
    /** Center column content. */
    children: ReactNode;
    /** Right sidebar utilities + popular lists. */
    utilities?: ReactNode;
    popular?: ReactNode;
}

/**
 * Explore page content frame. The shared navigation shell lives in the
 * route-level app/explore/layout.tsx so every Explore child route inherits it.
 */
export function ExploreLayout({ children, utilities, popular }: ExploreLayoutProps) {
    const hasRightContent = utilities !== undefined || popular !== undefined;
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    useDismissableOverlay(isLibraryOpen, () => setIsLibraryOpen(false));

    return (
        <>
            <UtilityNavbar
                searchContent={utilities}
                notificationsContent={<NotificationsPlaceholder />}
                onOpenLibrary={() => setIsLibraryOpen(true)}
            />

            {isLibraryOpen && hasRightContent && (
                <div className="explore-library-drawer-wrapper" role="dialog" aria-modal="true" aria-label="Library">
                    <button
                        type="button"
                        aria-label="Close library"
                        onClick={() => setIsLibraryOpen(false)}
                        className="explore-overlay-backdrop"
                    />
                    <div
                        id="library-drawer"
                        className="explore-library-drawer"
                    >
                        <button
                            type="button"
                            onClick={() => setIsLibraryOpen(false)}
                            aria-label="Close library"
                            className="explore-library-drawer-close"
                        >
                            <CloseIcon className="h-5 w-5" />
                        </button>
                        <div className="explore-library-drawer-body">
                            {utilities}
                            {popular !== undefined && (
                                <div className="explore-library-drawer-popular">
                                    {popular}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="explore-content-row">
                <main className="explore-content-main">
                    {children}
                </main>

                {hasRightContent && (
                    <aside className="explore-content-aside">
                        {utilities}
                        {popular !== undefined && (
                            <div className="explore-content-aside-popular">
                                {popular}
                            </div>
                        )}
                    </aside>
                )}
            </div>
        </>
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
