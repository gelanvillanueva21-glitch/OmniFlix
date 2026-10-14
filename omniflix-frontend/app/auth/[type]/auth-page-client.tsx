"use client";

import { useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound, useRouter } from "next/navigation";
import { AuthWindow } from "@/components/auth/AuthWindow";
import { AuthCollage } from "@/components/auth/AuthCollage";

type AuthType = "signin" | "signup";


type AuthPageClientProps = {
    mode: "signin" | "signup";
};

export default function AuthPageClient({ mode }: AuthPageClientProps) {
    const router = useRouter();
    const [, startTransition] = useTransition();


    const currentMode: AuthType = mode;
    const isSignIn = currentMode === "signin";

    const handleSwitchMode = (targetMode: "signin" | "signup") => {
        // Navigate between /auth/signin and /auth/signup cleanly
        startTransition(() => {
            router.push(`/auth/${targetMode}`, { scroll: false });
        });
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#111111] text-[#F5F5F5] relative overflow-hidden select-none">
            {/* ── Top Bar: Minimal Logo Return Link ── */}
            <header className="w-full max-w-360 mx-auto px-8 h-20 flex items-center justify-between z-30">
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

            {/* ── Main Dual-Slot Mirrored Layout ── */}
            <main className="flex-1 max-w-360 w-full mx-auto px-6 sm:px-12 flex items-center justify-center relative z-20 pb-12">
                {/* 
                    Two-column grid container for Desktop:
                    Left slot: Form Window in Sign In mode | Image Collage in Sign Up mode
                    Right slot: Image Collage in Sign In mode | Form Window in Sign Up mode
                */}
                <div className="w-full max-w-275 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-145 relative">
                    {/* 
                        Column 1 (LEFT SLOT):
                        In Sign In: displays the AuthWindow.
                        In Sign Up: displays the AuthCollage (staggered images moved to the left).
                    */}
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

                    {/* 
                        Column 2 (RIGHT SLOT):
                        In Sign In: displays the AuthCollage.
                        In Sign Up: displays on the LEFT (mirrored).
                    */}
                    <div
                        className={`flex items-center justify-center w-full transition-all duration-600 ease-in-out motion-reduce:transition-none ${
                            isSignIn
                                ? "lg:order-2 opacity-100 translate-x-0"
                                : "lg:order-1 opacity-100 translate-x-0"
                        }`}
                    >
                        <AuthCollage />
                    </div>
                </div>
            </main>

            {/* Ambient background lighting gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#8B5CF6]/[0.05] via-transparent to-transparent pointer-events-none -z-10" />
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-[#111111]/30 to-[#111111] pointer-events-none -z-10" />
        </div>
    );
}

