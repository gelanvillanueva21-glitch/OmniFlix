"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    CompassIcon,
    BookOpenIcon,
    FilmIcon,
    MonitorPlayIcon,
    UserIcon,
    LogOutIcon,
} from "@/components/icons/icons";
import type { ComponentType } from "react";

interface IconProps {
    readonly className?: string;
}

interface NavItem {
    readonly label: string;
    /** Route exists → Link; otherwise rendered as a disabled placeholder. */
    readonly href?: string;
    readonly Icon: ComponentType<IconProps>;
}

const MAIN_NAVIGATION: readonly NavItem[] = [
    { label: "Explore", href: "/explore", Icon: CompassIcon },
    { label: "Comics", href: "/explore/comics/asura-scans", Icon: BookOpenIcon },
    { label: "Novels", href: "/explore/novels", Icon: BookOpenIcon },
    { label: "Movies", href: "/explore/movies", Icon: FilmIcon },
    { label: "Series", href: "/explore/series", Icon: MonitorPlayIcon },
];

const PROFILE_SOURCE_ROUTES = [
    "/explore",
    "/comics",
    "/novels",
    "/movies",
    "/series",
] as const;

function profileHref(pathname: string | null) {
    const source = PROFILE_SOURCE_ROUTES.find(
        (route) => pathname === route || pathname?.startsWith(`${route}/`),
    );
    return source === undefined ? "/profile" : `/profile?from=${encodeURIComponent(pathname ?? source)}`;
}


function NavButton({
    item,
    isActive,
    isDisabled,
    onClick,
}: {
    item: NavItem;
    isActive?: boolean;
    isDisabled?: boolean;
    onClick?: () => void;
}) {
    const { Icon } = item;
    const classes = isActive
        ? "bg-[#8B5CF6]/15 text-[#A78BFA] font-medium"
        : "text-[#A1A1AA] hover:bg-[#242429]/70 hover:text-[#F5F5F5]";

    const inner = (
        <>
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{item.label}</span>
        </>
    );

    if (item.href === undefined) {
        return (
            <span
                className={`flex min-h-11 cursor-not-allowed items-center gap-3.5 rounded-lg px-4 text-sm opacity-60 ${classes}`}
                aria-disabled="true"
                title="Coming soon"
            >
                {inner}
            </span>
        );
    }

    if (isDisabled) {
        return (
            <span
                className={`flex min-h-11 items-center gap-3.5 rounded-lg px-4 text-sm transition-colors ${classes}`}
                aria-current={isActive ? "page" : undefined}
                aria-disabled="true"
            >
                {inner}
            </span>
        );
    }

    return (
        <Link
            href={item.href}
            onClick={onClick}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3.5 rounded-lg px-4 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${classes}`}
        >
            {inner}
        </Link>
    );
}

interface SidebarNavigationProps {
    /** Close the mobile drawer after navigation. */
    readonly onNavigate?: () => void;
}

export function SidebarNavigation({ onNavigate }: SidebarNavigationProps) {
    const pathname = usePathname();

    function isActive(item: NavItem): boolean {
        if (item.href === undefined) return false;
        // Comics highlights for the whole /explore/comics/* subtree because
        // the sidebar links to a default source route, not the index.
        if (item.href.startsWith("/explore/comics")) {
            return pathname === "/explore/comics" ||
                pathname?.startsWith("/explore/comics/") === true;
        }
        // "/explore" is the parent of every other section, so it must only
        // match exactly — otherwise it would be active on /explore/comics/*,
        // /explore/novels, etc. and steal the highlight (and get disabled).
        if (item.href === "/explore") {
            return pathname === "/explore";
        }
        return pathname === item.href || pathname?.startsWith(`${item.href}/`) === true;
    }

    return (
        <nav aria-label="Main navigation" className="space-y-1">
            <p className="px-4 pb-2 text-xs font-semibold tracking-wider text-[#A1A1AA] uppercase">
                Browse
            </p>
            {MAIN_NAVIGATION.map((item) => (
                <NavButton
                    key={item.label}
                    item={item}
                    isActive={isActive(item)}
                    isDisabled={isActive(item)}
                    onClick={onNavigate}
                />
            ))}
        </nav>
    );
}

interface AccountNavigationProps {
    readonly isAuthenticated: boolean;
    readonly username?: string;
    readonly onSignOut?: () => void;
    readonly onNavigate?: () => void;
}

export function AccountNavigation({
    isAuthenticated,
    username,
    onSignOut,
    onNavigate,
}: AccountNavigationProps) {
    const pathname = usePathname();

    if (!isAuthenticated) {
        return (
            <div className="space-y-1.5">
                <p className="px-4 pb-2 text-xs font-semibold tracking-wider text-[#A1A1AA] uppercase">
                    Account
                </p>
                {/* Guest profile section: avatar, name, link to /profile */}
                <Link
                    href={profileHref(pathname)}
                    onClick={onNavigate}
                    aria-current={pathname === "/profile" ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3.5 rounded-lg px-4 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${
                        pathname === "/profile"
                            ? "bg-[#8B5CF6]/15 text-[#A78BFA] font-medium"
                            : "text-[#A1A1AA] hover:bg-[#242429]/70 hover:text-[#F5F5F5]"
                    }`}
                >
                    <UserIcon className="h-5 w-5 shrink-0" />
                    <span className="truncate">Profile</span>
                </Link>
                <Link
                    href="/auth/signin"
                    onClick={onNavigate}
                    className="flex min-h-11 items-center rounded-lg px-4 text-sm text-[#A1A1AA] transition-colors hover:bg-[#242429]/70 hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                >
                    Sign In
                </Link>
                <Link
                    href="/auth/signup"
                    onClick={onNavigate}
                    className="flex min-h-11 items-center rounded-lg bg-[#8B5CF6] px-4 text-sm font-medium text-white transition-colors hover:bg-[#7C3AED] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D946EF]"
                >
                    Sign Up
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-1.5">
            <p className="px-4 pb-2 text-xs font-semibold tracking-wider text-[#A1A1AA] uppercase">
                Account
            </p>
            {username !== undefined && (
                <Link
                    href={profileHref(pathname)}
                    onClick={onNavigate}
                    className="flex min-h-11 items-center gap-3.5 rounded-lg px-4 text-sm text-[#F5F5F5] transition-colors hover:bg-[#242429]/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6]/15 text-[#A78BFA]">
                        <UserIcon className="h-4 w-4" />
                    </span>
                    <span className="truncate">
                        {username}
                    </span>
                </Link>
            )}
            <button
                type="button"
                onClick={onSignOut}
                className="flex min-h-11 w-full items-center gap-3.5 rounded-lg px-4 text-left text-sm text-[#A1A1AA] transition-colors hover:bg-[#242429]/70 hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
            >
                <LogOutIcon className="h-5 w-5 shrink-0" />
                Sign out
            </button>
        </div>
    );
}
