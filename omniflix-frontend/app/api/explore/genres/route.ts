import { NextRequest, NextResponse } from "next/server";
import {
    genreTaxonomy,
    isGenreMediaType,
    isGenreProvider,
} from "@/lib/genre";
import type { Genre } from "@/lib/media";
import { getJikanGenres } from "@/service/jikan/jikan.service";
import { getLncrawlGenreTags } from "@/service/lncrawl/lncrawl.service";
import {
    COMICK_SOURCE_TYPE,
    getSuwayomiGenreOptions,
    getSuwayomiSources,
} from "@/service/suwayomi/suwayomi.service";
import { getTmdbGenres } from "@/service/tmdb/tmdb.service";
import { isAdminRequest } from "@/service/server-auth.service";

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const provider = params.get("provider");
    const mediaType = params.get("mediaType");
    const sourceType = params.get("sourceType");

    if (!isGenreProvider(provider)) {
        return NextResponse.json(
            { error: "A supported provider is required." },
            { status: 400 },
        );
    }
    if (!isGenreMediaType(provider, mediaType)) {
        return NextResponse.json(
            { error: "The media type is not supported by this provider." },
            { status: 400 },
        );
    }
    if (
        provider === "suwayomi" &&
        (!sourceType || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sourceType))
    ) {
        return NextResponse.json(
            { error: "A supported comic source type is required." },
            { status: 400 },
        );
    }

    try {
        if (provider === "suwayomi") {
            const sources = await getSuwayomiSources();
            const source = sources.find(
                (candidate) =>
                    candidate.type === sourceType || candidate.id === sourceType,
            );
            if (!source) {
                return NextResponse.json(
                    { error: "The requested comic source is unavailable." },
                    { status: 400 },
                );
            }
            if (
                source.type === COMICK_SOURCE_TYPE &&
                !(await isAdminRequest())
            ) {
                return NextResponse.json(
                    { error: "This comic source is restricted to administrators." },
                    { status: 403 },
                );
            }

            const options = await getSuwayomiGenreOptions(source.type);
            return NextResponse.json({
                ...options,
                taxonomy: genreTaxonomy(provider),
            });
        }

        let genres: Genre[];
        if (provider === "tmdb") {
            if (mediaType !== "movies" && mediaType !== "series") {
                return NextResponse.json(
                    { error: "The media type is not supported by this provider." },
                    { status: 400 },
                );
            }
            genres = await getTmdbGenres(mediaType);
        } else if (provider === "jikan") {
            if (mediaType !== "anime" && mediaType !== "manga") {
                return NextResponse.json(
                    { error: "The media type is not supported by this provider." },
                    { status: 400 },
                );
            }
            genres = await getJikanGenres(mediaType);
        } else {
            genres = await getLncrawlGenreTags();
        }

        return NextResponse.json({
            genres,
            supported: true,
            taxonomy: genreTaxonomy(provider),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[api/explore/genres] request failed:", message);
        return NextResponse.json(
            { error: "The provider's genre list is unavailable right now." },
            { status: 502 },
        );
    }
}
