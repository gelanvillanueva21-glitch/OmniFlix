
"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AuthWindow } from "@/components/auth/AuthWindow";
import { AuthCollage } from "@/components/auth/AuthCollage";
import { useAuth } from "@/components/auth/AuthProvider";
import AuthPageSkeleton from "@/components/auth/AuthPageSkeleton";

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
    });

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
                <div className="min-h-screen flex flex-col bg-[#111111] text-[#F5F5F5] relative overflow-hidden select-none">
                    <header className="w-full max-w-360 mx-auto px-4 sm:px-8 h-20 flex items-center justify-between z-30">
                        <Link
                            href="/"
                            className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] rounded-md transition-opacity hover:opacity-90"
                            aria-label="Return to OmniFlix homepage"
                        >
                            <Image
                                src="/omniflix-orbit.svg"
                                alt="OmniFlix"
                                width={160}
                                height={40}
                                priority
                                className="h-10 w-auto"
                            />
                        </Link>

                        <Link
                            href="/"
                            className="text-xs tracking-wider uppercase text-[#A1A1AA] hover:text-[#F5F5F5] transition-colors py-1.5 px-3 rounded-full border border-transparent hover:border-[#27272A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                        >
                            Back to home
                        </Link>
                    </header>

                    <main className="flex-1 max-w-360 w-full mx-auto px-4 sm:px-12 flex items-center justify-center relative z-20 pb-6 sm:pb-12">
                        <div className="w-full max-w-275 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-16 items-center min-h-0 lg:min-h-145 relative">
                            {/* Auth form */}
                            <div
                                className={`flex items-center justify-center w-full transition-all duration-600 ease-in-out motion-reduce:transition-none ${
                                    isSignIn
                                        ? "lg:order-1 opacity-100 translate-x-0"
                                        : "lg:order-2 opacity-100 translate-x-0"
                                }`}
                            >
                                <AuthWindow
                                    mode={currentMode}
                                    onSwitchMode={handleSwitchMode}
                                />
                            </div>

                            {/* Hide collage on screens 650px and narrower */}
                            <div
                                className={`max-[650px]:hidden flex items-center justify-center w-full transition-all duration-600 ease-in-out motion-reduce:transition-none ${
                                    isSignIn
                                        ? "lg:order-2 opacity-100 translate-x-0"
                                        : "lg:order-1 opacity-100 translate-x-0"
                                }`}
                            >
                                <AuthCollage />
                            </div>
                        </div>
                    </main>

                    {/* Ambient background lighting */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#8B5CF6]/[0.05] via-transparent to-transparent pointer-events-none -z-10" />
                    <div className="absolute inset-0 bg-linear-to-b from-transparent via-[#111111]/30 to-[#111111] pointer-events-none -z-10" />
                </div>
            )}
        </>
    );
}
