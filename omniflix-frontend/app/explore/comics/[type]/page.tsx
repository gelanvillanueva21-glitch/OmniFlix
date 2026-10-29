import { ComicsPage } from "@/components/layouts/comics/ComicsPage";
import { COMICK_SOURCE_TYPE } from "@/service/suwayomi.service";
import { isAdminRequest } from "@/service/server-auth.service";
import { redirect } from "next/navigation";

export const instant = false;

interface ComicsSourcePageProps {
    params: Promise<{ type: string }>;
}

export default async function ComicsSourcePage({
    params,
}: ComicsSourcePageProps) {
    const { type } = await params;

    if (type === COMICK_SOURCE_TYPE && !(await isAdminRequest())) {
        redirect("/explore/comics");
    }

    return <ComicsPage sourceType={type} />;
}
