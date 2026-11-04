

import { Suspense } from "react";
import { SeriesDetailError, SeriesReadContent } from "@/components/layouts/series/SeriesReadContent";
import { DetailSkeleton } from "@/components/loading/ContentDetailLoad";

interface SeriesDetailPageProps {
    params: Promise<{ id: string }>;
}

/**
 * Series detail route. The dynamic segment carries the raw prefixed card id
 * (`tmdb:series:{id}` / `tmdb-{id}` / `jikan:{malId}` / `jikan-{malId}`) and
 * is passed untouched to `SeriesReadContent`, which resolves the provider
 * and numeric provider id.
 *
 * `params` is passed as a promise and only awaited inside the Suspense
 * boundary below, so the shared instant shell stays URL-independent.
 */
export default function SeriesDetailPage({ params }: SeriesDetailPageProps) {
    return (
        <Suspense fallback={<DetailSkeleton />}>
            <SeriesDetailParams params={params} />
        </Suspense>
    );
}

async function SeriesDetailParams({ params }: SeriesDetailPageProps) {
    const { id } = await params;

    if (!id.trim()) {
        return <SeriesDetailError message="Invalid series address." />;
    }

    return <SeriesReadContent seriesId={id} />;
}
