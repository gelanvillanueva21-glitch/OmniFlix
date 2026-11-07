import { NextRequest, NextResponse } from "next/server";
import { fetchSuwayomiComicDetails } from "@/service/suwayomi/suwayomi.fetch.service";

/**
 * Suwayomi comic detail API route. Read-only: exposes the existing
 * `fetchSuwayomiComicDetails` service so client components (e.g. the profile
 * collections) can resolve comic metadata without touching Suwayomi directly.
 * Params mirror the source-aware comic id: `suwayomi:<sourceId>:<comicId>`.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ sourceId: string; id: string }> },
) {
  const { sourceId, id } = await context.params;

  if (!/^\d+$/.test(sourceId) || !/^\d+$/.test(id)) {
    return NextResponse.json(
      { error: "A numeric Suwayomi source id and comic id are required." },
      { status: 400 },
    );
  }

  try {
    const payload = await fetchSuwayomiComicDetails(
      `suwayomi:${sourceId}:${id}`,
    );
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/comics/detail] request failed:", message);
    return NextResponse.json(
      { error: "Suwayomi is unavailable right now." },
      { status: 502 },
    );
  }
}
