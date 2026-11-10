import { notFound } from "next/navigation";
import GuestActivityPageClient from "../../../components/layouts/profile/guest-activity-page-client";
import AuthorizedActivityPageClient from "../../../components/layouts/profile/authorized-activity-page-client";
import {
    isAuthorizedMediaType,
    purposeTypeFromSearchParam,
} from "../../../components/layouts/profile/authorized-activity-types";

export const instant = false;

export default async function ProfileTypePage({
    params,
    searchParams,
}: {
    params: Promise<{ type: string }>;
    searchParams: Promise<{ purpose_type?: string }>;
}) {
    const { type } = await params;
    const { purpose_type: rawPurpose } = await searchParams;

    const rawType = type.toLowerCase();

    // `guest` keeps its existing no-param experience.
    if (rawType === "guest") {
        return <GuestActivityPageClient />;
    }

    // `authorize` (or a media type) renders the authenticated collection page
    // and REQUIRES a valid purpose_type query parameter.
    if (rawType === "authorize" || isAuthorizedMediaType(rawType)) {
        const purposeType = purposeTypeFromSearchParam(rawPurpose);
        if (!purposeType) {
            notFound();
        }
        return (
            <AuthorizedActivityPageClient
                mediaType={isAuthorizedMediaType(rawType) ? rawType : undefined}
                purposeType={purposeType}
            />
        );
    }

    notFound();
}
