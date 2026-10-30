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
            className={`auth-collage-slot ${className}`}
        >
            {!hasError ? (
                <>
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        sizes="(max-width: 1440px) 320px, 360px"
                        className="auth-collage-slot-image"
                        onError={() => setHasError(true)}
                        priority
                    />
                    {/* Subtle dark vignette overlay for cinematic atmosphere */}
                    <div className="auth-collage-slot-overlay" />
                </>
            ) : (
                /* Elegant charcoal-black fallback surface when image files are not yet present */
                <div
                    className={`auth-collage-fallback bg-gradient-to-br ${fallbackGradient}`}
                >
                    <div className="auth-collage-fallback-icon-ring">
                        <div className="auth-collage-fallback-icon-dot" />
                    </div>
                    <span className="auth-collage-fallback-label">
                        {label}
                    </span>
                    <div className="auth-collage-fallback-border" />
                </div>
            )}
        </div>
    );
}

export function AuthCollage() {
    return (
        <div
            className="auth-collage"
            aria-hidden="true"
        >
            {/* Ambient soft glow background behind the collage */}
            <div className="auth-collage-glow" />

            {/* 
                Staggered 3-layer composition:
                1. Top image: offset to the RIGHT (leaves noticeable gap on the LEFT).
                2. Middle image: offset to the LEFT (leaves noticeable gap on the RIGHT).
                3. Bottom image: offset to the RIGHT (leaves noticeable gap on the LEFT).
            */}
            <div className="auth-collage-stack">
                {/* 1. Top Image Element (.auth-image-top) */}
                <div className="auth-collage-slot-row-right">
                    <ImageSlot
                        src="/images/hero/top.jpg"
                        alt="Featured Comics and Manga"
                        className="auth-image-top"
                        fallbackGradient="from-[#1E1B2E] via-[#16161A] to-[#121215]"
                        label="Comics & Manga"
                    />
                </div>

                {/* 2. Middle Image Element (.auth-image-middle) */}
                <div className="auth-collage-slot-row-left">
                    <ImageSlot
                        src="/images/hero/middle.jpg"
                        alt="Featured Movies and Cinema"
                        className="auth-image-middle"
                        fallbackGradient="from-[#221B2B] via-[#19191D] to-[#141416]"
                        label="Movies & Series"
                    />
                </div>

                {/* 3. Bottom Image Element (.auth-image-bottom) */}
                <div className="auth-collage-slot-row-right-wide">
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

