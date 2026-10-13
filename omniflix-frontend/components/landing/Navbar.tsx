"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface NavigationItem {
    readonly label: string;
    readonly href: string;
}

const NAVIGATION_ITEMS: readonly NavigationItem[] = [
    { label: "Explore", href: "/explore" },
    { label: "Comics", href: "/comics" },
    { label: "Movies", href: "/movies" },
    { label: "Series", href: "/series" },
    { label: "Novels", href: "/novels" },
];

export function Navbar() {
    const currentPathname = usePathname();

    return (
        <header className="w-full border-b border-[#27272A]/70 bg-[#111111]/80 backdrop-blur-md sticky top-0 z-50">
            {/* 
                3-column CSS Grid: 
                - Left: Logo (auto)
                - Center: Navigation items (centered independently in the entire viewport)
                - Right: Action buttons (auto, aligned to the far right)
            */}
            <nav
                className="max-w-1440px mx-auto px-8 h-20 grid grid-cols-[1fr_auto_1fr] items-center"
                aria-label="Main Navigation"
            >
                {/* Left section: Clickable Logo */}
                <div className="flex items-center justify-start">
                    <Link
                        href="/"
                        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] rounded-md transition-opacity hover:opacity-90"
                        aria-label="OmniFlix Home"
                    >
                        <Image
                            src="/omniflix-orbit.svg"
                            alt="OmniFlix"
                            width={170}
                            height={50}
                            priority
                            className="h-10 w-auto"
                        />
                    </Link>
                </div>

                {/* Middle section: Centered Navigation */}
                <ul className="flex items-center gap-9" role="list">
                    {NAVIGATION_ITEMS.map((item) => {
                        const isRouteActive = currentPathname === item.href || currentPathname?.startsWith(`${item.href}/`);
                        const navigationItemClasses = isRouteActive
                            ? "text-[#F5F5F5] font-semibold"
                            : "text-[#A1A1AA] hover:text-[#F5F5F5] font-normal";

                        return (
                            <li key={item.label} className="flex items-center justify-center">
                                <Link
                                    href={item.href}
                                    className={`text-sm tracking-wide transition-colors duration-200 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] rounded ${navigationItemClasses}`}
                                    aria-current={isRouteActive ? "page" : undefined}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                {/* Right section: Account Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link
                        href="/auth/signin"
                        className="text-sm font-medium text-[#F5F5F5] px-4 py-2 rounded-full border border-transparent hover:border-[#27272A] hover:bg-[#1C1C1F]/60 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                    >
                        Sign in
                    </Link>
                    <Link
                        href="/auth/signup"
                        className="text-sm font-medium text-white px-5 py-2 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] transition-all duration-200 shadow-sm shadow-[#8B5CF6]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D946EF]"
                    >
                        Sign up
                    </Link>
                </div>
            </nav>
        </header>
    );
}

