import { NextRequest, NextResponse } from "next/server";
import {
  COMICK_SOURCE_TYPE,
  fetchSuwayomiCatalog,
  getSuwayomiSources,
} from "@/service/suwayomi/suwayomi.service";
import { isAdminRequest } from "@/service/server-auth.service";

/**
 * Comics API route for the Explore Comics page. Delegates to the existing
 * Suwayomi service so the browser never talks to Suwayomi directly.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  try {
    if (params.get("kind") === "sources") {
      const canAccessComick = await isAdminRequest();
      const sources = (await getSuwayomiSources()).filter(
        (source) =>
          canAccessComick || source.type !== COMICK_SOURCE_TYPE,
      );
      return NextResponse.json({ sources });
    }

    const sourceType = params.get("sourceType");
    const page = Number(params.get("page") ?? "1");
    const rawType = params.get("type") ?? "POPULAR";
    const query = params.get("query")?.trim();

    if (!sourceType || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sourceType)) {
      return NextResponse.json(
        { error: "A supported comic source type is required." },
        { status: 400 },
      );
    }
    const requestedSource = (await getSuwayomiSources()).find(
      (source) => source.type === sourceType || source.id === sourceType,
    );
    if (
      requestedSource?.type === COMICK_SOURCE_TYPE &&
      !(await isAdminRequest())
    ) {
      return NextResponse.json(
        { error: "This comic source is restricted to administrators." },
        { status: 403 },
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

    const catalog = await fetchSuwayomiCatalog(sourceType, page, type, query);
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
