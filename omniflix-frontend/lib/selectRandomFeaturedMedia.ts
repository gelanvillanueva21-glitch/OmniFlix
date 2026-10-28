import type { MediaItem } from "@/lib/media";
import type { ExplorePopularMedia } from "@/lib/explore";

/**
 * Randomly selects one popular media item from the grouped
 * popular-content data (comics, novels, movies, series).
 * Returns null when no items are available.
 */
export function selectRandomFeaturedMedia(
  popularMedia: ExplorePopularMedia,
): MediaItem | null {
  const eligible: MediaItem[] = [
    ...popularMedia.comics,
    ...popularMedia.novels,
    ...popularMedia.movies,
    ...popularMedia.series,
  ];

  if (eligible.length === 0) {
    return null;
  }

  return eligible[Math.floor(Math.random() * eligible.length)];
}
