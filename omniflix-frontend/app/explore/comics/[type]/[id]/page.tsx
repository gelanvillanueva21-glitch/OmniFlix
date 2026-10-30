import { Suspense } from "react";
import Link from "next/link";
import { ReadContent } from "@/components/ReadContent";
import {
    fetchSuwayomiComicDetails,
    fetchSuwayomiChapters,
} from "@/service/suwayomi.fetch.service";
import styles from "@/components/ReadContent.module.css";

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
    let details;
    let chaptersPage;
    try {
        details = await fetchSuwayomiComicDetails(sourceAwareId);
        chaptersPage = await fetchSuwayomiChapters(sourceAwareId, 1);
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
            comic={details.comic}
            chapters={chaptersPage.chapters}
            sourceName={details.sourceName}
        />
    );
}

function ComicsDetailSkeleton() {
    return (
        <article className={styles.readContent} aria-busy="true">
            <div className={styles.detailRow}>
                <div className={styles.coverSection}>
                    <div className={`${styles.coverFrame} skeleton-shimmer`} />
                </div>
                <div className={styles.infoSection}>
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
            <Link href="/comics">Back to Comics</Link>
        </section>
    );
}
