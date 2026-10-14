
'use client'

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function ExplorePage() {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter()

    useEffect(() => {
        if (isLoading) return

        if (!user) router.replace("/");
    }, [user, isLoading, router]);

    return (
        <div>
            Explore.
            <button onClick={logout}>
                Logout.
            </button>
        </div>
    )
}

