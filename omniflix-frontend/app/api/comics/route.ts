import { NextRequest, NextResponse } from "next/server";
import {
  fetchSuwayomiCatalog,
  getSuwayomiSources,
} from "@/service/suwayomi.service";

/**
 * Comics API route for the Explore Comics page. Delegates to the existing
 * Suwayomi service so the browser never talks to Suwayomi directly.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  try {
    if (params.get("kind") === "sources") {
      const sources = await getSuwayomiSources();
      return NextResponse.json({ sources });
    }

    const source = params.get("source");
    const page = Number(params.get("page") ?? "1");
    const rawType = params.get("type") ?? "POPULAR";
    const query = params.get("query")?.trim();

    if (!source || !/^\d+$/.test(source)) {
      return NextResponse.json(
        { error: "A numeric source id is required." },
        { status: 400 },
      );
    }
    if (!Number.isInteger(page) || page < 1) {
      return NextResponse.json(
        { error: "Page must be a positive integer." },
        { status: 400 },
      );
    }
    if (rawType === "SEARCH" && !query) {
      return NextResponse.json(
        { error: "A query is required for search." },
        { status: 400 },
      );
    }
    const type =
      rawType === "LATEST" || rawType === "SEARCH" ? rawType : "POPULAR";

    const catalog = await fetchSuwayomiCatalog(source, page, type, query);
    return NextResponse.json(catalog);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/comics] request failed:", message);
    return NextResponse.json(
      { error: "Suwayomi is unavailable or the source request failed." },
      { status: 502 },
    );
  }
}
