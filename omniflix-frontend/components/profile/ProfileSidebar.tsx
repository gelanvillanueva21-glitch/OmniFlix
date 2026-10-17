"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { SidebarLogo } from "@/components/explore/SidebarNavigation";
import {
    UserIcon,
    LogOutIcon,
} from "@/components/icons/icons";

interface ProfileSidebarProps {
    readonly onSignOut: () => void;
    readonly onOpenLibrary?: () => void;
}

/**
 * Profile page left sidebar. Authenticated: avatar, name, History box (empty
 * state until the activity API exists), Change Password + Sign Out. Guest:
 * avatar, "Guest", Sign In/Up, benefits message — no History box.
 */
export function ProfileSidebar({ onSignOut, onOpenLibrary }: ProfileSidebarProps) {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-full flex-col">
                <div className="px-2 pt-1 pb-6">
                    <SidebarLogo />
                </div>
                <div className="mt-4 space-y-3 px-2" aria-hidden="true">
                    <div className="h-16 w-16 rounded-full bg-[#27272A] animate-pulse motion-reduce:animate-none" />
                    <div className="h-4 w-28 rounded bg-[#27272A] animate-pulse motion-reduce:animate-none" />
                    <div className="h-24 rounded-lg bg-[#27272A] animate-pulse motion-reduce:animate-none" />
                </div>
            </div>
        );
    }

    if (!isAuthenticated || user === null) {
        return (
            <div className="flex h-full flex-col">
                <div className="px-2 pt-1 pb-6">
                    <SidebarLogo />
                </div>

                <div className="mt-6 flex flex-1 flex-col px-2">
                    <div className="flex items-center gap-3">
                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#242429] text-[#A1A1AA]">
                            <UserIcon className="h-7 w-7" />
                        </span>
                        <p className="text-lg font-semibold text-[#F5F5F5]">Guest</p>
                    </div>

                    <p className="text-xs leading-relaxed text-[#A1A1AA]">
                        Sign in or create an account to save favorites, build your
                        watchlist, and organize your entertainment.
                    </p>

                    <div className="mt-auto flex flex-col gap-2 pt-8">
                        <Link
                            href="/auth/signin"
                            className="flex min-h-11 items-center justify-center rounded-lg px-4 text-sm text-[#A1A1AA] transition-colors hover:bg-[#242429]/70 hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/auth/signup"
                            className="flex min-h-11 items-center justify-center rounded-lg bg-[#8B5CF6] px-4 text-sm font-medium text-white transition-colors hover:bg-[#7C3AED] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D946EF]"
                        >
                            Sign Up
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            <div className="px-2 pt-1 pb-6">
                <SidebarLogo />
            </div>

            <div className="mt-4 flex flex-1 flex-col space-y-5 px-2">
                {/* Avatar + name (UserResponse has no profile picture or display
                    name yet — fallback: username + default avatar icon) */}
                <div className="flex items-center gap-3">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6]/15 text-[#A78BFA]">
                        <UserIcon className="h-7 w-7" />
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-[#F5F5F5]">
                            {user.username}
                        </p>
                    </div>
                </div>

                {/* History box — empty state until the activity API exists */}
                <div className="min-h-40 rounded-lg border border-[#29292E] bg-[#171719] p-4">
                    <p className="text-xs font-semibold tracking-wider text-[#A1A1AA] uppercase">
                        History
                    </p>
                    <p className="mt-2 text-xs text-[#A1A1AA]">
                        No recent activity yet. Titles you open will appear here.
                    </p>
                    {/* TODO: render real recent activity once the activity API exists. */}
                </div>

                {onOpenLibrary && (
                    <button
                        type="button"
                        onClick={onOpenLibrary}
                        className="flex min-h-12 items-center justify-center rounded-lg bg-[#8B5CF6] px-4 text-sm font-medium text-white transition-colors hover:bg-[#7C3AED] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D946EF]"
                    >
                        Open Library
                    </button>
                )}

                <div className="mt-auto flex flex-col gap-2 pt-8">
                    {/* Change Password: no existing UI flow is wired, so render as
                        a disabled placeholder rather than a broken control. */}
                    <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        title="Coming soon"
                        className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-lg px-4 text-left text-sm opacity-60 text-[#A1A1AA]"
                    >
                        Change Password
                    </button>
                    <button
                        type="button"
                        onClick={onSignOut}
                        className="flex min-h-11 items-center gap-3 rounded-lg px-4 text-left text-sm text-[#A1A1AA] transition-colors hover:bg-[#242429]/70 hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                    >
                        <LogOutIcon className="h-5 w-5 shrink-0" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
