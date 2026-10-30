"use client";

import Image from "next/image";

/** OmniFlix brand mark used by the explore sidebar and profile pages. */
export function SidebarLogo() {
    return (
        <div className="sidebar-logo">
            <Image
                src="/omniflix-orbit.svg"
                alt="OmniFlix"
                width={170}
                height={50}
                priority
                className="sidebar-logo-image"
            />
        </div>
    );
}
