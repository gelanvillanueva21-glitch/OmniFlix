import { NextRequest, NextResponse } from "next/server";
import { getJikanAnimePage } from "@/service/jikan/jikan.service";
import { getLncrawlNovelsPage } from "@/service/lncrawl/lncrawl.service";
import { getSuwayomiComicsPage } from "@/service/suwayomi/suwayomi.service";
import { fetchTmdbMediaPage } from "@/service/tmdb/tmdb.service";
import { uniqueMediaItems } from "@/service/provider-client.service";
import type { MediaItem } from "@/lib/media";

const PAGE_SIZE = 12;
const MAX_PAGE = 25; // Jikan caps /top/anime at 25 pages.

interface DiscoverPage {
  items: MediaItem[];
  /** True while any of the four providers still has more pages. */
  hasNextPage: boolean;
}

/**
 * Paginated Discover More API route for the Explore page. Read-only: fetches
 * one page from each provider (LNcrawl `offset`, Suwayomi catalog page,
 * TMDB `page`, Jikan page) so the browser never sees the provider URLs.
 * The pagination contract matches the movies/series routes (`items` +
 * `hasNextPage`) so the shared Load more control works identically. Jikan's
 * public API is rate limited (3 req/s, 60/min); page-by-page fetching plus the
 * shared `providerRequest` timeout keep us within those limits.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const pageParam = Number(params.get("page") ?? "1");

  if (!Number.isInteger(pageParam) || pageParam < 1) {
    return NextResponse.json(
      { error: "Page must be a positive integer." },
      { status: 400 },
    );
  }
  if (pageParam > MAX_PAGE) {
    return NextResponse.json(
      { error: "Page exceeds the provider page limit." },
      { status: 400 },
    );
  }

  const results = await Promise.allSettled([
    getSuwayomiComicsPage(PAGE_SIZE, pageParam),
    getLncrawlNovelsPage(PAGE_SIZE, pageParam),
    fetchTmdbMediaPage(PAGE_SIZE, pageParam),
    getJikanAnimePage(PAGE_SIZE, pageParam),
  ]);

  // Normalize each provider's response shape to a common page object.
  const providerPages = results.map((result) => {
    if (result.status === "rejected") {
      return { items: [] as MediaItem[], hasNextPage: false, failed: true };
    }
    const value = result.value;
    const items = "movies" in value
      ? [...value.movies, ...value.series]
      : value.items;
    return { items, hasNextPage: value.hasNextPage, failed: false };
  });

  const providerFailures = providerPages.filter((page) => page.failed).length;

  if (providerFailures === providerPages.length) {
    return NextResponse.json(
      { error: "Discover is unavailable right now." },
      { status: 502 },
    );
  }

  const merged = uniqueMediaItems(
    providerPages.flatMap((page) => page.items),
  );

  const discoverPage: DiscoverPage = {
    items: merged,
    // With no provider `total` count the offset walk relies on any provider
    // still reporting more pages; when every provider stops reporting, the
    // pagination stops.
    hasNextPage: providerPages.some((page) => page.hasNextPage),
  };
  return NextResponse.json(discoverPage);
}


