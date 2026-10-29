"use client";

import Image from "next/image";

/** OmniFlix brand mark used by the explore sidebar and profile pages. */
export function SidebarLogo() {
    return (
        <div className="inline-flex items-center">
            <Image
                src="/omniflix-orbit.svg"
                alt="OmniFlix"
                width={170}
                height={50}
                priority
                className="h-7 w-auto sm:h-9"
            />
        </div>
    );
}
