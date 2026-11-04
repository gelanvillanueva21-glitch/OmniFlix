import Link from "next/link";
import { ReadContent } from "@/components/ReadContent";
import type { MediaItem } from "@/lib/media";
import { fetchJikanMangaDetail } from "@/service/jikan/jikan.fetch.service";

interface JikanMangaDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function JikanMangaDetailPage({
    params,
}: JikanMangaDetailPageProps) {
    const { id } = await params;
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
        return <JikanMangaDetailError />;
    }

    let manga: MediaItem;
    try {
        manga = await fetchJikanMangaDetail(id);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[explore/comics/jikan] manga detail failed:", message);
        return <JikanMangaDetailError unavailable />;
    }

    return (
        <ReadContent
            data={{
                id: manga.id,
                title: manga.title,
                coverImage: manga.coverImage,
                description: manga.description,
                genres: manga.genres,
            }}
            chapters={[]}
            sourceName="Jikan Manga"
        />
    );
}

function JikanMangaDetailError({
    unavailable = false,
}: {
    unavailable?: boolean;
}) {
    return (
        <section className="comic-detail-error">
            <h1>Manga unavailable</h1>
            <p>
                {unavailable
                    ? "Jikan manga details could not be loaded."
                    : "Invalid manga address."}
            </p>
            <Link href="/explore/comics">Back to Comics</Link>
        </section>
    );
}
