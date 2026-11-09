import { notFound } from "next/navigation";
import GuestActivityPageClient from "./guest-activity-page-client";

export const instant = false;

export default async function ProfileTypePage({
    params,
    }: {
    params: Promise<{ type: string }>;
    }) {
    const { type } = await params;

    const rawType = type.toLowerCase();
    if (rawType !== "guest" && rawType !== "authorize") {
        notFound();
    }

    // `authorize` is reserved for the future authenticated activity history.
    if (rawType === "authorize") {
        return null;
    }

    return <GuestActivityPageClient />;
}
