
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
        <header className="sticky top-0 z-50 w-full border-b border-[#27272A]/70 bg-[#111111]/80 backdrop-blur-md">
            <nav
                className="mx-auto grid h-16 w-full max-w-1440px grid-cols-[1fr_auto] items-center px-4 sm:h-20 sm:grid-cols-[1fr_auto_1fr] sm:px-8"
                aria-label="Main Navigation"
            >
                {/* Logo */}
                <div className="flex items-center justify-start">
                    <Link
                        href="/"
                        className="inline-flex items-center rounded-md transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                        aria-label="OmniFlix Home"
                    >
                        <Image
                            src="/omniflix-orbit.svg"
                            alt="OmniFlix"
                            width={170}
                            height={50}
                            priority
                            className="h-7 w-auto sm:h-10"
                        />
                    </Link>
                </div>

                {/* Desktop category navigation */}
                <ul className="hidden items-center gap-9 sm:flex" role="list">
                    {NAVIGATION_ITEMS.map((item) => {
                        const isRouteActive =
                            currentPathname === item.href ||
                            currentPathname?.startsWith(`${item.href}/`);

                        const navigationItemClasses = isRouteActive
                            ? "text-[#F5F5F5] font-semibold"
                            : "text-[#A1A1AA] hover:text-[#F5F5F5] font-normal";

                        return (
                            <li key={item.label}>
                                <Link
                                    href={item.href}
                                    className={`rounded py-1 text-sm tracking-wide transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${navigationItemClasses}`}
                                    aria-current={isRouteActive ? "page" : undefined}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                {/* Account actions */}
                <div className="flex items-center justify-end gap-1.5 sm:gap-4">
                    <Link
                        href="/auth/signin"
                        className="rounded-full px-2.5 py-2 text-xs font-medium text-[#F5F5F5] transition-all duration-200 hover:bg-[#1C1C1F]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] sm:border sm:border-transparent sm:px-4 sm:text-sm sm:hover:border-[#27272A]"
                    >
                        Sign in
                    </Link>

                    <Link
                        href="/auth/signup"
                        className="rounded-full bg-[#8B5CF6] px-3.5 py-2 text-xs font-medium text-white shadow-sm shadow-[#8B5CF6]/30 transition-all duration-200 hover:bg-[#7C3AED] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D946EF] sm:px-5 sm:text-sm"
                    >
                        Sign up
                    </Link>
                </div>
            </nav>
        </header>
    );
}
