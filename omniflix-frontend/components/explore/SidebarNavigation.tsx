"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    CompassIcon,
    BookOpenIcon,
    FilmIcon,
    MonitorPlayIcon,
    UserIcon,
    LibraryIcon,
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
    // Catalog routes are future work — rendered as non-links for now.
    { label: "Comics", Icon: BookOpenIcon },
    { label: "Novels", Icon: BookOpenIcon },
    { label: "Movies", Icon: FilmIcon },
    { label: "Series", Icon: MonitorPlayIcon },
];

const ACCOUNT_NAVIGATION: readonly NavItem[] = [
    { label: "Profile", Icon: UserIcon },
    { label: "My Library", Icon: LibraryIcon },
];


export function SidebarLogo() {
    return (
        <div className="inline-flex items-center">
            <Image
                src="/omniflix-orbit.svg"
                alt="OmniFlix"
                width={170}
                height={50}
                priority
                className="h-7 w-auto sm:h-9"
            />
        </div>
    );
}

function NavButton({
    item,
    isActive,
    onClick,
}: {
    item: NavItem;
    isActive?: boolean;
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

    return (
        <nav aria-label="Main navigation" className="space-y-1">
            <p className="px-4 pb-2 text-xs font-semibold tracking-wider text-[#A1A1AA] uppercase">
                Browse
            </p>
            {MAIN_NAVIGATION.map((item) => (
                <NavButton
                    key={item.label}
                    item={item}
                    isActive={
                        item.href !== undefined &&
                        (pathname === item.href ||
                            pathname?.startsWith(`${item.href}/`) === true)
                    }
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
    if (!isAuthenticated) {
        return (
            <div className="space-y-1.5">
                <p className="px-4 pb-2 text-xs font-semibold tracking-wider text-[#A1A1AA] uppercase">
                    Account
                </p>
                <Link
                    href="/auth/signin"
                    onClick={onNavigate}
                    className="flex min-h-11 items-center rounded-lg px-4 text-sm text-[#A1A1AA] transition-colors hover:bg-[#242429]/70 hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                >
                    Sign in
                </Link>
                <Link
                    href="/auth/signup"
                    onClick={onNavigate}
                    className="flex min-h-11 items-center rounded-lg bg-[#8B5CF6] px-4 text-sm font-medium text-white transition-colors hover:bg-[#7C3AED] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D946EF]"
                >
                    Sign up
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
                <p className="truncate px-4 pb-1 text-sm text-[#F5F5F5]">
                    {username}
                </p>
            )}
            {ACCOUNT_NAVIGATION.map((item) => (
                <NavButton key={item.label} item={item} onClick={onNavigate} />
            ))}
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
