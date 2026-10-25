import { NextRequest, NextResponse } from "next/server";
import { searchJikanAnime } from "@/service/jikan.service";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = params.get("query") ?? "";
  const pageParam = Number(params.get("page") ?? "1");
  const limitParam = Number(params.get("limit") ?? "20");

  if (!query.trim()) {
    return NextResponse.json({ items: [], hasNextPage: false });
  }

  try {
    const { items, hasNextPage } = await searchJikanAnime(
      query,
      pageParam,
      limitParam,
    );
    return NextResponse.json({ items, hasNextPage });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/jikan/search-anime] request failed:", message);
    return NextResponse.json(
      { error: "Jikan is unavailable right now." },
      { status: 502 },
    );
  }
}

