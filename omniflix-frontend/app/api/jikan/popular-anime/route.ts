 import { NextRequest, NextResponse } from "next/server";
import { getJikanAnimePage } from "@/service/jikan.service";
import { uniqueMediaItems } from "@/service/provider-client.service";
import type { MediaItem } from "@/lib/media";

const MAX_LIMIT = 25;
const MAX_PAGE = 25; // Jikan caps /top/anime at 25 pages.

/**
 * Popular anime API route for the Explore Series section. Read-only: fetches
 * Jikan `/top/anime` via the existing service so the browser never sees the
 * Jikan URL. Pagination contract matches the movies/series routes
 * (`items` + `hasNextPage`) so the shared Load more control works identically.
 * Jikan's public API is rate limited (3 req/s, 60/min); the shared
 * `providerRequest` timeout plus this route's page-by-page fetching keep us
 * within those limits.
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
    if (pageParam > MAX_PAGE) {
      return NextResponse.json(
        { error: "Page exceeds the Jikan page limit." },
        { status: 400 },
      );
    }

    const { items, hasNextPage } = await getJikanAnimePage(
      limitParam,
      pageParam,
    );
    const popularAnime = uniqueMediaItems(items);

    const response: { items: MediaItem[]; hasNextPage: boolean } = {
      items: popularAnime,
      hasNextPage,
    };
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/jikan/popular-anime] request failed:", message);
    return NextResponse.json(
      { error: "Jikan is unavailable right now." },
      { status: 502 },
    );
  }
}
