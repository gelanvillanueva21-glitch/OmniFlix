import { notFound } from "next/navigation";
import AuthPageClient from "./auth-page-client";

export const instant = false;

export default async function DynamicAuthPage({
    params,
    }: {
    params: Promise<{ type: string }>;
    }) {
    const { type } = await params;

    const rawType = type.toLowerCase();
    if (rawType !== "signin" && rawType !== "signup") {
        notFound();
    }

    return <AuthPageClient mode={rawType} />;
}