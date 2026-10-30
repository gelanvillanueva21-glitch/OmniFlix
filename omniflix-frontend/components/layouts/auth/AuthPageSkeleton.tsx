import Image from "next/image";

export default function AuthPageSkeleton() {
    return (
        <div
            role="status"
            aria-label="Loading authentication page"
            className="auth-skeleton-page"
        >
            {/* Top navigation */}
            <header className="auth-skeleton-header">
                <div className="auth-skeleton-logo-slot">
                    <Image
                        src="/omniflix-orbit.svg"
                        alt="OmniFlix"
                        width={28}
                        height={28}
                    />
                </div>
                <div
                    aria-hidden="true"
                    className="auth-skeleton-nav-pill"
                />
            </header>

            {/* Main mirrored layout */}
            <main className="auth-skeleton-main">
                {/* Ambient lighting */}
                <div
                    aria-hidden="true"
                    className="auth-skeleton-ambient"
                    style={{
                        background:
                            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139, 92, 246, 0.08), transparent 70%)",
                    }}
                />

                {/* Auth card column */}
                <div className="auth-skeleton-card-column">
                    <div className="auth-skeleton-card">
                        <div
                            aria-hidden="true"
                            className="auth-skeleton-heading"
                        />
                        <div
                            aria-hidden="true"
                            className="auth-skeleton-heading-sub"
                        />
                        <div className="auth-skeleton-fields">
                            {[0, 1].map((i) => (
                                <div key={i} className="auth-skeleton-field-group">
                                    <div
                                        aria-hidden="true"
                                        className="auth-skeleton-field-label"
                                    />
                                    <div
                                        aria-hidden="true"
                                        className="auth-skeleton-field-box"
                                    />
                                </div>
                            ))}
                            <div
                                aria-hidden="true"
                                className="auth-skeleton-submit"
                            />
                        </div>
                        <div
                            aria-hidden="true"
                            className="auth-skeleton-switch"
                        />
                    </div>
                </div>

                {/* Image collage column (desktop only) */}
                <div
                    aria-hidden="true"
                    className="auth-skeleton-collage-column"
                >
                    <div className="auth-skeleton-collage-block auth-skeleton-collage-block--top-left" />
                    <div className="auth-skeleton-collage-block auth-skeleton-collage-block--top-right" />
                    <div className="auth-skeleton-collage-block auth-skeleton-collage-block--bottom-left" />
                    <div className="auth-skeleton-collage-block auth-skeleton-collage-block--bottom-right" />
                </div>

                <span className="sr-only">Loading sign in…</span>
            </main>
        </div>
    );
}