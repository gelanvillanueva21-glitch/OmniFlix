import { Suspense } from "react";
import Link from "next/link";
import { ReadContent } from "@/components/ReadContent";
import { fetchSuwayomiComicPayload } from "@/service/suwayomi.fetch.service";

export const instant = false;

interface ComicsDetailPageProps {
    params: Promise<{ type: string; id: string }>;
}

export default async function ComicsDetailPage({ params }: ComicsDetailPageProps) {
    const { type, id } = await params;

    if (!/^\d+$/.test(type) || !/^\d+$/.test(id) || !isSafePositiveInteger(id)) {
        return <ComicsDetailError message="Invalid comic address." />;
    }

    const sourceAwareId = `suwayomi:${type}:${id}`;

    return (
        <Suspense fallback={<ComicsDetailSkeleton />}>
            <ComicsDetailContent sourceAwareId={sourceAwareId} />
        </Suspense>
    );
}

async function ComicsDetailContent({ sourceAwareId }: { sourceAwareId: string }) {
    let payload;
    try {
        payload = await fetchSuwayomiComicPayload(sourceAwareId);
    } catch (error) {
        return (
            <ComicsDetailError
                message={
                    error instanceof Error
                        ? error.message
                        : "Comic details could not be loaded."
                }
            />
        );
    }

    return (
        <ReadContent
            comic={payload.comic}
            chapters={payload.chapters}
            sourceName={payload.sourceName}
        />
    );
}

function ComicsDetailSkeleton() {
    return (
        <article className="readContent" aria-busy="true">
            <div className="detailRow">
                <div className="detailsSection">
                    <div className="skeleton-shimmer h-8 w-2/3 rounded-md mb-4" />
                    <div className="skeleton-shimmer h-4 w-1/3 rounded-md mb-6" />
                    <div className="skeleton-shimmer h-24 w-full rounded-md mb-6" />
                    <div className="skeleton-shimmer h-10 w-48 rounded-lg" />
                </div>
            </div>
        </article>
    );
}

function isSafePositiveInteger(raw: string): boolean {
    const value = Number(raw);
    return Number.isSafeInteger(value) && value >= 1;
}

function ComicsDetailError({ message }: { message: string }) {
    return (
        <section className="comic-detail-error ">
            <h1>Comic unavailable</h1>
            <p>{message}</p>
            <Link href="explore/comics">Back to Comics</Link>
        </section>
    );
}
