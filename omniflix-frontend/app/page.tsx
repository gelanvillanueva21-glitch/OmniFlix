'use client'

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";


export default function HomePage() {
    const { user, isLoading } = useAuth()
    const router = useRouter();

    useEffect(() => {
        if (isLoading) 
            return;
        if (user) 
            router.replace("/explore");
    }, [user, isLoading, router])


    return (
        <>
            {isLoading ? (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950"
                >
                    <div
                        aria-hidden="true"
                        className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-slate-200 motion-reduce:animate-none"
                    />
                    <p className="mt-6 text-base font-medium text-white">
                        A moment, please...
                    </p>
                    <p className="mt-1.5 text-sm text-slate-400">
                        We&apos;re getting things ready for you.
                    </p>
                </div>
            ):(
                <div className="min-h-screen flex flex-col bg-[#111111] text-[#F5F5F5] selection:bg-[#8B5CF6]/30 selection:text-white">
                    <Navbar />
                    <main className="flex-1 flex flex-col">
                        <HeroSection />
                    </main>
                </div>
            )}
        </>
    );
}




