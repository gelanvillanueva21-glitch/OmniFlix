import Link from "next/link";
import Image from "next/image";

interface ExploreButtonProps {
    readonly href?: string;
}

export function ExploreButton({ href = "/explore" }: ExploreButtonProps) {
    return (
        <div className="flex items-center justify-center">
            <Link
                href={href}
                className="group inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] active:bg-[#6D28D9] text-white font-medium text-sm md:text-base shadow-lg shadow-[#8B5CF6]/25 hover:shadow-[#8B5CF6]/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D946EF]"
            >
                <span>Explore</span>
                <Image
                    src="/arrow-right.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="invert transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                />
            </Link>
        </div>
    );
}

