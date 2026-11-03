import { NextRequest, NextResponse } from "next/server";
import { searchTmdbMovies } from "@/service/tmdb/tmdb.service";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = params.get("query") ?? "";
  const pageParam = Number(params.get("page") ?? "1");
  const limitParam = Number(params.get("limit") ?? "20");

  if (!query.trim()) {
    return NextResponse.json({ items: [], totalPages: 0 });
  }

  try {
    const { items, totalPages } = await searchTmdbMovies(
      query,
      pageParam,
      limitParam,
    );
    return NextResponse.json({ items, totalPages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/tmdb/search-movies] request failed:", message);
    return NextResponse.json(
      { error: "TMDB is unavailable right now." },
      { status: 502 },
    );
  }
}
