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
        ? "explore-nav-item--active"
        : "explore-nav-item--inactive";

    const inner = (
        <>
            <Icon className="explore-nav-icon" />
            <span className="explore-nav-truncate">{item.label}</span>
        </>
    );

    if (item.href === undefined) {
        return (
            <span
                className={`explore-nav-item explore-nav-item--disabled-cursor ${classes}`}
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
                className={`explore-nav-item explore-nav-item--interactive ${classes}`}
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
            className={`explore-nav-item explore-nav-item--interactive ${classes}`}
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
        <nav aria-label="Main navigation" className="explore-nav">
            <p className="explore-nav-heading">
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
            <div className="explore-nav-heading-group">
                <p className="explore-nav-heading">
                    Account
                </p>
                {/* Guest profile section: avatar, name, link to /profile */}
                <Link
                    href={profileHref(pathname)}
                    onClick={onNavigate}
                    aria-current={pathname === "/profile" ? "page" : undefined}
                    className={`explore-nav-item explore-nav-item--interactive ${
                        pathname === "/profile"
                            ? "explore-nav-item--active"
                            : "explore-nav-item--inactive"
                    }`}
                >
                    <UserIcon className="explore-nav-icon" />
                    <span className="explore-nav-truncate">Profile</span>
                </Link>
                <Link
                    href="/auth/signin"
                    onClick={onNavigate}
                    className="explore-nav-signin"
                >
                    Sign In
                </Link>
                <Link
                    href="/auth/signup"
                    onClick={onNavigate}
                    className="explore-nav-signup"
                >
                    Sign Up
                </Link>
            </div>
        );
    }

    return (
        <div className="explore-nav-heading-group">
            <p className="explore-nav-heading">
                Account
            </p>
            {username !== undefined && (
                <Link
                    href={profileHref(pathname)}
                    onClick={onNavigate}
                    className="explore-nav-item explore-nav-item--plain"
                >
                    <span className="explore-nav-avatar">
                        <UserIcon className="explore-nav-avatar-icon" />
                    </span>
                    <span className="explore-nav-truncate">
                        {username}
                    </span>
                </Link>
            )}
            <button
                type="button"
                onClick={onSignOut}
                className="explore-nav-signout"
            >
                <LogOutIcon className="explore-nav-icon" />
                Sign out
            </button>
        </div>
    );
}
