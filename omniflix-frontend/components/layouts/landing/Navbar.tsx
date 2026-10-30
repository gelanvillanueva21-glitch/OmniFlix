
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
    { label: "Comics", href: "/explore/comics" },
    { label: "Movies", href: "/explore/movies" },
    { label: "Series", href: "/explore/series" },
    { label: "Novels", href: "/explore/novels" },
];

export function Navbar() {
    const currentPathname = usePathname();

    return (
        <header className="landing-navbar">
            <nav
                className="landing-navbar-nav"
                aria-label="Main Navigation"
            >
                {/* Logo */}
                <div className="landing-navbar-logo-slot">
                    <Link
                        href="/"
                        className="landing-navbar-logo-link"
                        aria-label="OmniFlix Home"
                    >
                        <Image
                            src="/omniflix-orbit.svg"
                            alt="OmniFlix"
                            width={170}
                            height={50}
                            priority
                            className="landing-navbar-logo-image"
                        />
                    </Link>
                </div>

                {/* Desktop category navigation */}
                <ul className="landing-navbar-links" role="list">
                    {NAVIGATION_ITEMS.map((item) => {
                        const isRouteActive =
                            currentPathname === item.href ||
                            currentPathname?.startsWith(`${item.href}/`);

                        const navigationItemClasses = isRouteActive
                            ? "landing-navbar-link landing-navbar-link--active"
                            : "landing-navbar-link landing-navbar-link--inactive";

                        return (
                            <li key={item.label}>
                                <Link
                                    href={item.href}
                                    className={navigationItemClasses}
                                    aria-current={isRouteActive ? "page" : undefined}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                {/* Account actions */}
                <div className="landing-navbar-actions">
                    <Link
                        href="/auth/signin"
                        className="landing-navbar-signin"
                    >
                        Sign in
                    </Link>

                    <Link
                        href="/auth/signup"
                        className="landing-navbar-signup"
                    >
                        Sign up
                    </Link>
                </div>
            </nav>
        </header>
    );
}
