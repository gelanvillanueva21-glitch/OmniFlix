import { Suspense } from "react";
import Link from "next/link";
import { NovelContentPage } from "@/components/layouts/novels/NovelContentPage";
import { DetailSkeleton } from "@/components/loading/ContentDetailLoad";

export const instant = false;

interface NovelsDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function NovelsDetailPage({ params }: NovelsDetailPageProps) {
    const { id } = await params;
    const novelId = id.startsWith("lncrawl%3A")
        ? id.slice("lncrawl%3A".length)
        : id;

    if (!novelId.trim()) {
        return <NovelsDetailError message="Invalid novel address." />;
    }

    return (
        <Suspense fallback={<DetailSkeleton />}>
            <NovelContentPage novelId={novelId} />
        </Suspense>
    );
}

function NovelsDetailError({ message }: { message: string }) {
    return (
        <section className="comic-detail-error">
            <h1>Novel unavailable</h1>
            <p>{message}</p>
            <Link href="/explore/novels">Back to Novels</Link>
        </section>
    );
}
