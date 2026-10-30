import Link from "next/link";
import Image from "next/image";

interface ExploreButtonProps {
    readonly href?: string;
}

export function ExploreButton({ href = "/explore" }: ExploreButtonProps) {
    return (
        <div className="landing-explore-button-slot">
            <Link
                href={href}
                className="landing-explore-button"
            >
                <span>Explore</span>
                <Image
                    src="/arrow-right.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="landing-explore-button-icon"
                    aria-hidden="true"
                />
            </Link>
        </div>
    );
}

