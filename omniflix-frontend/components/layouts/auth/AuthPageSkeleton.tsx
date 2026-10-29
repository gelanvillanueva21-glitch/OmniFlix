import Image from "next/image";

const bar = "rounded bg-[#27272A]";
const field = "h-11 rounded-md bg-[#27272A]";

export default function AuthPageSkeleton() {
    return (
        <div
            role="status"
            aria-label="Loading authentication page"
            className="flex min-h-screen flex-col bg-[#111111] text-[#F5F5F5]"
        >
            {/* Top navigation */}
            <header className="flex h-16 w-full items-center justify-between px-6 lg:px-12">
                <div className="flex items-center gap-2.5">
                    <Image
                        src="/omniflix-orbit.svg"
                        alt="OmniFlix"
                        width={28}
                        height={28}
                    />
                </div>
                <div
                    aria-hidden="true"
                    className="h-4 w-24 rounded bg-[#27272A]"
                />
            </header>

            {/* Main mirrored layout */}
            <main className="relative mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-12 lg:grid lg:grid-cols-2 lg:gap-16">
                {/* Ambient lighting */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139, 92, 246, 0.08), transparent 70%)",
                    }}
                />

                {/* Auth card column */}
                <div className="relative w-full max-w-md">
                    <div className="w-full rounded-2xl border border-[#27272A] bg-[#18181B] p-8 lg:p-10">
                        <div
                            aria-hidden="true"
                            className={`${bar} h-7 w-2/5 animate-pulse motion-reduce:animate-none`}
                        />
                        <div
                            aria-hidden="true"
                            className={`${bar} mt-3 h-4 w-3/5 animate-pulse motion-reduce:animate-none`}
                        />
                        <div className="mt-8 space-y-5">
                            {[0, 1].map((i) => (
                                <div key={i} className="space-y-2">
                                    <div
                                        aria-hidden="true"
                                        className="h-3.5 w-16 rounded bg-[#3F3F46] animate-pulse motion-reduce:animate-none"
                                    />
                                    <div
                                        aria-hidden="true"
                                        className={`${field} animate-pulse motion-reduce:animate-none`}
                                    />
                                </div>
                            ))}
                            <div
                                aria-hidden="true"
                                className="mt-2 h-11 w-full rounded-md bg-[#3F3F46] animate-pulse motion-reduce:animate-none"
                            />
                        </div>
                        <div
                            aria-hidden="true"
                            className={`${bar} mx-auto mt-8 h-4 w-40 animate-pulse motion-reduce:animate-none`}
                        />
                    </div>
                </div>

                {/* Image collage column (desktop only) */}
                <div
                    aria-hidden="true"
                    className="relative hidden h-120 w-full lg:block"
                >
                    <div className="absolute left-0 top-6 h-56 w-2/5 rounded-xl bg-[#27272A] animate-pulse motion-reduce:animate-none" />
                    <div className="absolute right-0 top-0 h-64 w-1/2 rounded-xl bg-[#3F3F46] animate-pulse motion-reduce:animate-none" />
                    <div className="absolute bottom-0 left-8 h-52 w-1/3 rounded-xl bg-[#27272A] animate-pulse motion-reduce:animate-none" />
                    <div className="absolute bottom-10 right-6 h-40 w-2/5 rounded-xl bg-[#3F3F46] animate-pulse motion-reduce:animate-none" />
                </div>

                <span className="sr-only">Loading sign in…</span>
            </main>
        </div>
    );
}