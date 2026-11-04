import { NextRequest, NextResponse } from "next/server";
import { fetchAnimeDataPayload } from "@/service/jikan/jikan.fetch.service";

/**
 * Jikan anime detail API route. Read-only: exposes the server-only
 * `fetchAnimeDataPayload` service so the browser never sees the Jikan proxy
 * URL. The dynamic segment is the bare numeric MyAnimeList id — prefix
 * parsing stays on the client.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { error: "A numeric MyAnimeList id is required." },
      { status: 400 },
    );
  }

  try {
    const payload = await fetchAnimeDataPayload(id);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/jikan/anime] request failed:", message);
    return NextResponse.json(
      { error: "Jikan is unavailable right now." },
      { status: 502 },
    );
  }
}
