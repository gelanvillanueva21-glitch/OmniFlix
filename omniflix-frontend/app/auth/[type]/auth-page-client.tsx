
"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AuthWindow } from "@/components/layouts/auth/AuthWindow";
import { AuthCollage } from "@/components/layouts/auth/AuthCollage";
import { useAuth } from "@/components/AuthProvider";
import AuthPageSkeleton from "@/components/layouts/auth/AuthPageSkeleton";

type AuthType = "signin" | "signup";

type AuthPageClientProps = {
    mode: "signin" | "signup";
};

export default function AuthPageClient({ mode }: AuthPageClientProps) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [, startTransition] = useTransition();

    useEffect(() => {
        if (isLoading) return;
        if (user) router.replace("/explore");
    }, [user, isLoading, router]);

    const currentMode: AuthType = mode;
    const isSignIn = currentMode === "signin";

    const handleSwitchMode = (targetMode: "signin" | "signup") => {
        startTransition(() => {
            router.push(`/auth/${targetMode}`, { scroll: false });
        });
    };

    return (
        <>
            {isLoading ? (
                <AuthPageSkeleton />
            ) : (
                <div className="auth-page-shell">
                    <header className="auth-page-header">
                        <Link
                            href="/"
                            className="auth-page-logo-link"
                            aria-label="Return to OmniFlix homepage"
                        >
                            <Image
                                src="/omniflix-orbit.svg"
                                alt="OmniFlix"
                                width={160}
                                height={40}
                                priority
                                className="auth-page-logo-image"
                            />
                        </Link>

                        <Link
                            href="/"
                            className="auth-page-home-link"
                        >
                            Back to home
                        </Link>
                    </header>

                    <main className="auth-page-main">
                        <div className="auth-page-columns">
                            {/* Auth form */}
                            <div
                                className={`auth-page-form-column ${
                                    isSignIn
                                        ? "auth-page-form-column--signin"
                                        : "auth-page-form-column--signup"
                                }`}
                            >
                                <AuthWindow
                                    mode={currentMode}
                                    onSwitchMode={handleSwitchMode}
                                />
                            </div>

                            {/* Hide collage below lg (1024px); desktop keeps it */}
                            <div
                                className={`auth-page-collage-column ${
                                    isSignIn
                                        ? "auth-page-collage-column--signin"
                                        : "auth-page-collage-column--signup"
                                }`}
                            >
                                <AuthCollage />
                            </div>
                        </div>
                    </main>

                    {/* Ambient background lighting */}
                    <div className="auth-page-ambient-glow" />
                    <div className="auth-page-ambient-fade" />
                </div>
            )}
        </>
    );
}
