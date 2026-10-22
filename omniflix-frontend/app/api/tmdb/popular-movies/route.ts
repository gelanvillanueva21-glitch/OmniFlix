import { NextRequest, NextResponse } from "next/server";
import { getPopularTmdbMovies } from "@/service/tmdb.service";
import { uniqueMediaItems } from "@/service/provider-client.service";
import type { MediaItem } from "@/lib/media";

const MAX_LIMIT = 20;

/**
 * Popular movies API route for the Explore Movies section. Read-only:
 * fetches TMDB `/movie/popular` via the existing service so the browser
 * never sees the TMDB credentials. Pagination contract matches the comics
 * and novels catalog routes (`items` + `hasNextPage`) so the shared
 * Load more control works identically.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const limitParam = Number(params.get("limit") ?? "10");
  const pageParam = Number(params.get("page") ?? "1");

  try {
    if (
      !Number.isInteger(limitParam) ||
      limitParam < 1 ||
      limitParam > MAX_LIMIT
    ) {
      return NextResponse.json(
        { error: `Limit must be an integer between 1 and ${MAX_LIMIT}.` },
        { status: 400 },
      );
    }
    if (!Number.isInteger(pageParam) || pageParam < 1) {
      return NextResponse.json(
        { error: "Page must be a positive integer." },
        { status: 400 },
      );
    }
    // TMDB caps `/movie/popular` at 500 pages.
    if (pageParam > 500) {
      return NextResponse.json(
        { error: "Page exceeds the TMDB page limit." },
        { status: 400 },
      );
    }

    const { items, totalPages } = await getPopularTmdbMovies(
      limitParam,
      pageParam,
    );
    const popularMovie = uniqueMediaItems(items);

    const response: { items: MediaItem[]; hasNextPage: boolean } = {
      items: popularMovie,
      hasNextPage: pageParam < totalPages,
    };
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/tmdb/popular-movies] request failed:", message);
    return NextResponse.json(
      { error: "TMDB is unavailable right now." },
      { status: 502 },
    );
  }
}
