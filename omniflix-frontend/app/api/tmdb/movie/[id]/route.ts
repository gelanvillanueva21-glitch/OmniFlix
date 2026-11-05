import { NextRequest, NextResponse } from "next/server";
import { fetchMovieById } from "@/service/tmdb/fetchMovieById.service";

/**
 * TMDB movie detail API route. Read-only: exposes the server-only
 * `fetchMovieById` service so the browser never sees TMDB credentials.
 * The dynamic segment is the bare numeric TMDB movie id — prefix parsing
 * stays on the client.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { error: "A numeric TMDB movie id is required." },
      { status: 400 },
    );
  }

  try {
    const payload = await fetchMovieById(id);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/tmdb/movie] request failed:", message);
    return NextResponse.json(
      { error: "TMDB is unavailable right now." },
      { status: 502 },
    );
  }
}
