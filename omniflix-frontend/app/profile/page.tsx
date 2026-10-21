export const instant = false;
import { Suspense } from "react";
import ProfilePageClient from "./profile-page-client";

export default function ProfilePage() {
    // `profile-page-client` reads `useSearchParams()`, which requires a
    // Suspense boundary during prerendering.
    return (
        <Suspense>
            <ProfilePageClient />
        </Suspense>
    );
}
