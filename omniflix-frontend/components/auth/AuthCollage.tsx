"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageSlotProps {
    readonly src: string;
    readonly alt: string;
    readonly className: string;
    readonly fallbackGradient: string;
    readonly label: string;
}

function ImageSlot({ src, alt, className, fallbackGradient, label }: ImageSlotProps) {
    const [hasError, setHasError] = useState(false);

    return (
        <div
            className={`relative overflow-hidden border border-[#3A3A40]/50 shadow-2xl shadow-black/80 transition-all duration-500 hover:opacity-100 ${className}`}
        >
            {!hasError ? (
                <>
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        sizes="(max-width: 1440px) 320px, 360px"
                        className="object-cover"
                        onError={() => setHasError(true)}
                        priority
                    />
                    {/* Subtle dark vignette overlay for cinematic atmosphere */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/70 via-transparent to-[#111111]/20 pointer-events-none" />
                </>
            ) : (
                /* Elegant charcoal-black fallback surface when image files are not yet present */
                <div
                    className={`w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br ${fallbackGradient} relative`}
                >
                    <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center justify-center mb-2">
                        <div className="w-3 h-3 rounded-full bg-[#8B5CF6]/50 animate-pulse" />
                    </div>
                    <span className="text-[11px] font-medium tracking-wider uppercase text-[#A1A1AA]/70">
                        {label}
                    </span>
                    <div className="absolute inset-0 border border-white/5 rounded-[inherit] pointer-events-none" />
                </div>
            )}
        </div>
    );
}

export function AuthCollage() {
    return (
        <div
            className="w-full h-full min-h-[580px] flex flex-col justify-center items-center pointer-events-none select-none relative"
            aria-hidden="true"
        >
            {/* Ambient soft glow background behind the collage */}
            <div className="absolute w-80 h-80 rounded-full bg-[#8B5CF6]/10 blur-[100px] pointer-events-none -z-10" />

            {/* 
                Staggered 3-layer composition:
                1. Top image: offset to the RIGHT (leaves noticeable gap on the LEFT).
                2. Middle image: offset to the LEFT (leaves noticeable gap on the RIGHT).
                3. Bottom image: offset to the RIGHT (leaves noticeable gap on the LEFT).
            */}
            <div className="w-full max-w-[460px] flex flex-col gap-6 relative">
                {/* 1. Top Image Element (.auth-image-top) */}
                <div className="w-full flex justify-end pr-2">
                    <ImageSlot
                        src="/images/hero/top.jpg"
                        alt="Featured Comics and Manga"
                        className="auth-image-top"
                        fallbackGradient="from-[#1E1B2E] via-[#16161A] to-[#121215]"
                        label="Comics & Manga"
                    />
                </div>

                {/* 2. Middle Image Element (.auth-image-middle) */}
                <div className="w-full flex justify-start pl-2">
                    <ImageSlot
                        src="/images/hero/middle.jpg"
                        alt="Featured Movies and Cinema"
                        className="auth-image-middle"
                        fallbackGradient="from-[#221B2B] via-[#19191D] to-[#141416]"
                        label="Movies & Series"
                    />
                </div>

                {/* 3. Bottom Image Element (.auth-image-bottom) */}
                <div className="w-full flex justify-end pr-4">
                    <ImageSlot
                        src="/images/hero/bottom.jpg"
                        alt="Featured Novels and Stories"
                        className="auth-image-bottom"
                        fallbackGradient="from-[#1A1826] via-[#161619] to-[#111113]"
                        label="Novels & Stories"
                    />
                </div>
            </div>
        </div>
    );
}

