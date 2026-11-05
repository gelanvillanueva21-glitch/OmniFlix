import { NextRequest, NextResponse } from "next/server";
import { fetchSeriesDataPayload } from "@/service/tmdb/tmdb.fetch.service";

/**
 * TMDB series detail API route. Read-only: exposes the server-only
 * `fetchSeriesDataPayload` service so the browser never sees TMDB
 * credentials. The dynamic segment is the bare numeric TMDB series id —
 * prefix parsing stays on the client.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { error: "A numeric TMDB series id is required." },
      { status: 400 },
    );
  }

  try {
    const payload = await fetchSeriesDataPayload(id);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/tmdb/series] request failed:", message);
    return NextResponse.json(
      { error: "TMDB is unavailable right now." },
      { status: 502 },
    );
  }
}
