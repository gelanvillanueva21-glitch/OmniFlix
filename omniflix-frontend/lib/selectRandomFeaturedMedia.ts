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

interface RandomItemProps {
  items: MediaItem[];
}


export function selectRandomMediaFeatured({ items }: RandomItemProps): MediaItem | null {
  if (items.length === 0) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)];
}


interface RandomSeriesProps {
  tv: MediaItem[];
  anime: MediaItem[];
}

export function selectRandomSeries({ tv, anime }: RandomSeriesProps): MediaItem | null {
  const eligible: MediaItem[] = [...tv, ...anime];

  if (eligible.length === 0) {
    return null;
  }

  return eligible[Math.floor(Math.random() * eligible.length)];
}

