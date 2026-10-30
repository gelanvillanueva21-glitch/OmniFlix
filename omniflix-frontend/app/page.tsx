'use client'

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


import { Navbar } from "@/components/layouts/landing/Navbar";
import { HeroSection } from "@/components/layouts/landing/HeroSection";


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
                    className="home-loading-overlay"
                >
                    <div
                        aria-hidden="true"
                        className="home-loading-spinner"
                    />
                    <p className="home-loading-title">
                        A moment, please...
                    </p>
                    <p className="home-loading-subtitle">
                        We&apos;re getting things ready for you.
                    </p>
                </div>
            ):(
                <div className="home-page-shell">
                    <Navbar />
                    <main className="home-page-main">
                        <HeroSection />
                    </main>
                </div>
            )}
        </>
    );
}




