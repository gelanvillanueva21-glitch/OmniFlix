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
                <div className="fixed inset-0 z-50 lg:block xl:hidden" role="dialog" aria-modal="true" aria-label="Library">
                    <button
                        type="button"
                        aria-label="Close library"
                        onClick={() => setIsLibraryOpen(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <div
                        id="library-drawer"
                        className="absolute inset-y-0 right-0 w-80 max-w-[90vw] overflow-y-auto border-l border-[#29292E] bg-[#171719] px-5 py-6 shadow-xl"
                    >
                        <button
                            type="button"
                            onClick={() => setIsLibraryOpen(false)}
                            aria-label="Close library"
                            className="absolute top-4 right-3 inline-flex h-11 w-11 items-center justify-center rounded-lg text-[#A1A1AA] hover:bg-[#242429] hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                        >
                            <CloseIcon className="h-5 w-5" />
                        </button>
                        <div className="space-y-8 pr-10">
                            {utilities}
                            {popular !== undefined && (
                                <div className="space-y-8 border-t border-[#29292E] pt-6">
                                    {popular}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex">
                <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    {children}
                </main>

                {hasRightContent && (
                    <aside className="sticky top-0 hidden h-screen w-80 shrink-0 overflow-y-auto border-l border-[#29292E] bg-[#171719] px-5 py-8 xl:block">
                        {utilities}
                        {popular !== undefined && (
                            <div className="mt-8 space-y-8 border-t border-[#29292E] pt-6">
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
