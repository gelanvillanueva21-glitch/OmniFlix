import { SidebarLogo } from "@/components/SidebarLogo";

const collectionTabWidths = ["w-24", "w-24", "w-24", "w-20", "w-32", "w-28", "w-20"];

function SkeletonBlock({ className }: { readonly className: string }) {
    return (
        <div
            className={`skeleton-block ${className}`}
        />
    );
}

function SkeletonSidebar() {
    return (
        <div className="explore-sidebar-body" aria-hidden="true">
            <div className="explore-sidebar-logo-slot">
                <SidebarLogo />
            </div>

            <div className="explore-sidebar-loading">
                <div className="profile-sidebar-identity">
                    <SkeletonBlock className="profile-sidebar-avatar h-16" />
                    <SkeletonBlock className="h-5 w-28" />
                </div>

                <div className="profile-history-box">
                    <SkeletonBlock className="h-3 w-16" />
                    <SkeletonBlock className="mt-4 h-16 w-full rounded-md" />
                </div>

                <SkeletonBlock className="profile-sidebar-library-button-shim" />

                <div className="profile-sidebar-footer--wide">
                    <SkeletonBlock className="h-5 w-24" />
                    <SkeletonBlock className="h-5 w-32" />
                    <SkeletonBlock className="h-5 w-24" />
                </div>
            </div>
        </div>
    );
}

function SkeletonMediaRow({ index }: { readonly index: number }) {
    return (
        <section className="profile-skeleton-row" aria-hidden="true">
            <SkeletonBlock className="profile-skeleton-row-title" />
            <div className="profile-skeleton-row-track">
                {Array.from({ length: 4 }, (_, cardIndex) => (
                    <div
                        key={`${index}-${cardIndex}`}
                        className="profile-skeleton-row-card"
                    >
                        <SkeletonBlock className="profile-skeleton-row-poster" />
                        <SkeletonBlock className="profile-skeleton-row-title-line" />
                        <SkeletonBlock className="profile-skeleton-row-subtitle-line" />
                    </div>
                ))}
            </div>
        </section>
    );
}

function SkeletonMainContent() {
    return (
        <div aria-hidden="true">
            <div className="profile-skeleton-main">
                <div className="profile-skeleton-main-caption">
                    <SkeletonBlock className="profile-skeleton-main-title" />
                    <SkeletonBlock className="profile-skeleton-main-subtitle" />
                </div>
            </div>

            <SkeletonCollectionContent />
        </div>
    );
}

function SkeletonCollectionContent() {
    return (
        <>
            <nav className="profile-skeleton-tabs">
                {collectionTabWidths.map((width, index) => (
                    <SkeletonBlock
                        key={`${width}-${index}`}
                        className={`profile-skeleton-tab ${width}`}
                    />
                ))}
            </nav>

            <div className="profile-skeleton-rows">
                {[0, 1, 2, 3].map((index) => (
                    <SkeletonMediaRow key={index} index={index} />
                ))}
            </div>
        </>
    );
}

export function ProfileSkeleton() {
    return (
        <main
            className="profile-skeleton-shell"
            aria-label="Loading profile"
        >
            <section className="profile-skeleton-mobile">
                <div className="profile-skeleton-mobile-scroll">
                    <SkeletonSidebar />
                </div>
            </section>

            <section className="profile-skeleton-tablet">
                <header className="profile-skeleton-tablet-header">
                    <SkeletonBlock className="profile-sidebar-avatar-shim" />
                    <SkeletonBlock className="h-8 w-28" />
                </header>
                <div className="profile-skeleton-tablet-scroll">
                    <div className="profile-skeleton-tablet-container">
                        <div className="profile-skeleton-tablet-hero" aria-hidden="true">
                            <SkeletonBlock className="profile-tablet-hero-avatar" />
                            <div className="profile-skeleton-tablet-caption">
                                <SkeletonBlock className="h-7 w-40" />
                                <SkeletonBlock className="h-4 w-28" />
                            </div>
                        </div>
                        <SkeletonCollectionContent />
                    </div>
                </div>
            </section>

            <section className="profile-skeleton-desktop">
                <aside className="profile-skeleton-desktop-sidebar">
                    <SkeletonSidebar />
                </aside>
                <div className="profile-skeleton-desktop-scroll">
                    <div className="profile-skeleton-desktop-container">
                        <SkeletonMainContent />
                    </div>
                </div>
            </section>
        </main>
    );
}
