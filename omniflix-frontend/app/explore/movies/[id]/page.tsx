import { Suspense } from "react";
import { MovieReadContent } from "@/components/layouts/movies/MovieReadContent";
import { DetailSkeleton } from "@/components/loading/ContentDetailLoad";

interface MovieDetailPageProps {
    params: Promise<{ id: string }>;
}

export default function MovieDetailPage({ params }: MovieDetailPageProps) {
    return (
        <Suspense fallback={<DetailSkeleton />}>
            <MovieDetailParams params={params} />
        </Suspense>
    );
}

async function MovieDetailParams({ params }: MovieDetailPageProps) {
    const { id } = await params;

    if (!id.trim()) {
        return <MovieReadContent movieId={undefined} />;
    }

    return <MovieReadContent movieId={id} />;
}
