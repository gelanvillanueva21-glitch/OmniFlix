/**
 * Small inline SVG icon set, following the existing EyeToggleIcon convention
 * (stroke-based, currentColor, sized by className). Icons render decorative
 * meaning only; accessible labels live on the controls that use them.
 */

interface IconProps {
    readonly className?: string;
}

function baseProps(className?: string) {
    return {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.75,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        className: className ?? "w-5 h-5",
        "aria-hidden": true,
    };
}

export function CompassIcon({ className }: IconProps) {
    return (
        <svg {...baseProps(className)}>
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
    );
}

export function BookOpenIcon({ className }: IconProps) {
    return (
        <svg {...baseProps(className)}>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
    );
}

export function FilmIcon({ className }: IconProps) {
    return (
        <svg {...baseProps(className)}>
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M7 4v16M17 4v16M2 9h20M2 15h20" />
        </svg>
    );
}

export function MonitorPlayIcon({ className }: IconProps) {
    return (
        <svg {...baseProps(className)}>
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="m10 8 5 3-5 3z" />
            <path d="M8 21h8M12 17v4" />
        </svg>
    );
}

export function SearchIcon({ className }: IconProps) {
    return (
        <svg {...baseProps(className)}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    );
}

export function BellIcon({ className }: IconProps) {
    return (
        <svg {...baseProps(className)}>
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
    );
}

export function UserIcon({ className }: IconProps) {
    return (
        <svg {...baseProps(className)}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

export function LibraryIcon({ className }: IconProps) {
    return (
        <svg {...baseProps(className)}>
            <path d="m16 6 4 14" />
            <path d="M12 6v14" />
            <path d="M8 8v12" />
            <path d="M4 4v16" />
        </svg>
    );
}

export function LogOutIcon({ className }: IconProps) {
    return (
        <svg {...baseProps(className)}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
        </svg>
    );
}

export function MenuIcon({ className }: IconProps) {
    return (
        <svg {...baseProps(className)}>
            <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );
}

export function CloseIcon({ className }: IconProps) {
    return (
        <svg {...baseProps(className)}>
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    );
}

export function ChevronRightIcon({ className }: IconProps) {
    return (
        <svg {...baseProps(className)}>
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}

export function ChevronLeftIcon({ className }: IconProps) {
    return (
        <svg {...baseProps(className)}>
            <path d="m15 18-6-6 6-6" />
        </svg>
    );
}

export function StarIcon({ className }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className ?? "w-4 h-4"}
            aria-hidden={true}
        >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    );
}

export function ImageIcon({ className }: IconProps) {
    return (
        <svg {...baseProps(className)}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" />
        </svg>
    );
}

export function ArrowLeft({ className }: IconProps) {
    return (
        <svg {...baseProps(className)}>
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
        </svg>
    );
}

export const ArrowLeftIcon = ArrowLeft;

export function Loader2({ className }: IconProps) {
    return (
        <svg {...baseProps(className)}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
}

export const Loader2Icon = Loader2;

export function Tv({ className }: IconProps) {
    return (
        <svg {...baseProps(className)}>
            <rect width="20" height="15" x="2" y="7" rx="2" />
            <polyline points="17 2 12 7 7 2" />
        </svg>
    );
}

export const TvIcon = Tv;

