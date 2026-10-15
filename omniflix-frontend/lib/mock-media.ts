import type { Genre, MediaItem } from "./media";

/**
 * Temporary mock data so the Explore layout can be built and verified before
 * any content API is integrated. Every item is clearly fictional; ratings are
 * shown only to exercise the UI and must be replaced by real provider data.
 * Images point at picsum.photos placeholders — MediaCard treats a failed load
 * the same as a missing image, so the UI never depends on this provider.
 *
 * When real APIs arrive: export per-provider mapper functions from lib/media.ts
 * and swap these constants for React Query hooks that call the service layer.
 */

export const MOCK_FEATURED: MediaItem = {
    id: "feat-1",
    title: "Echoes of the Void",
    type: "series",
    description:
        "A stranded deep-space crew discovers the signal they followed was never meant for them. Now every answer pulls them further from home.",
    coverImage: "https://picsum.photos/seed/omniflix-feature/1200/500",
    genres: ["Sci-Fi", "Thriller"],
    releaseYear: 2025,
};

export const MOCK_TRENDING: MediaItem[] = [
    { id: "t1", title: "Crimson Petal", type: "comics", coverImage: "https://picsum.photos/seed/omniflix-t1/300/450", genres: ["Romance", "Drama"] },
    { id: "t2", title: "The Ashen Crown", type: "novels", coverImage: "https://picsum.photos/seed/omniflix-t2/300/450", genres: ["Fantasy"] },
    { id: "t3", title: "Midnight Protocol", type: "movies", coverImage: "https://picsum.photos/seed/omniflix-t3/300/450", genres: ["Action"] },
    { id: "t4", title: "Paper Lanterns", type: "series", coverImage: "https://picsum.photos/seed/omniflix-t4/300/450", genres: ["Slice of Life"] },
    { id: "t5", title: "Iron Meridian", type: "comics", coverImage: "https://picsum.photos/seed/omniflix-t5/300/450", genres: ["Sci-Fi"] },
    { id: "t6", title: "Salt and Stone", type: "novels", coverImage: "https://picsum.photos/seed/omniflix-t6/300/450", genres: ["Adventure"] },
    { id: "t7", title: "Glass Harbor", type: "movies", coverImage: "https://picsum.photos/seed/omniflix-t7/300/450", genres: ["Mystery"] },
    { id: "t8", title: "The Quiet Grid", type: "series", coverImage: "https://picsum.photos/seed/omniflix-t8/300/450", genres: ["Drama"] },
];

export const MOCK_RECOMMENDED: MediaItem[] = [
    { id: "r1", title: "Wolves of Autumn Street", type: "comics", coverImage: "https://picsum.photos/seed/omniflix-r1/300/450", genres: ["Action"] },
    { id: "r2", title: "A Study in Ember", type: "novels", coverImage: "https://picsum.photos/seed/omniflix-r2/300/450", genres: ["Mystery"] },
    { id: "r3", title: "Night Shift 9", type: "movies", coverImage: "https://picsum.photos/seed/omniflix-r3/300/450", genres: ["Thriller"] },
    { id: "r4", title: "The Longest Orbit", type: "series", coverImage: "https://picsum.photos/seed/omniflix-r4/300/450", genres: ["Sci-Fi"] },
    { id: "r5", title: "Hollow Signal", type: "comics", coverImage: "https://picsum.photos/seed/omniflix-r5/300/450", genres: ["Horror"] },
    { id: "r6", title: "Cartographer's Daughter", type: "novels", coverImage: "https://picsum.photos/seed/omniflix-r6/300/450", genres: ["Fantasy"] },
    { id: "r7", title: "Static Bloom", type: "series", coverImage: "https://picsum.photos/seed/omniflix-r7/300/450", genres: ["Drama"] },
];

export const MOCK_GENRES: Genre[] = [
    { id: "action", label: "Action" },
    { id: "romance", label: "Romance" },
    { id: "fantasy", label: "Fantasy" },
    { id: "sci-fi", label: "Sci-Fi" },
    { id: "mystery", label: "Mystery" },
    { id: "horror", label: "Horror" },
    { id: "drama", label: "Drama" },
    { id: "comedy", label: "Comedy" },
];

export const MOCK_POPULAR: Record<"comics" | "novels" | "movies" | "series", MediaItem[]> = {
    comics: [
        { id: "p-c1", title: "Blade of the Nine", type: "comics", coverImage: "https://picsum.photos/seed/omniflix-pc1/120/180" },
        { id: "p-c2", title: "Silent Verse", type: "comics", coverImage: "https://picsum.photos/seed/omniflix-pc2/120/180" },
        { id: "p-c3", title: "Gilded Cage", type: "comics", coverImage: "https://picsum.photos/seed/omniflix-pc3/120/180" },
        { id: "p-c4", title: "After the Rain Falls", type: "comics", coverImage: "https://picsum.photos/seed/omniflix-pc4/120/180" },
        { id: "p-c5", title: "Northbound Train", type: "comics", coverImage: "https://picsum.photos/seed/omniflix-pc5/120/180" },
    ],
    novels: [
        { id: "p-n1", title: "The Unwritten Sea", type: "novels", coverImage: "https://picsum.photos/seed/omniflix-pn1/120/180" },
        { id: "p-n2", title: "Dust and Diamonds", type: "novels", coverImage: "https://picsum.photos/seed/omniflix-pn2/120/180" },
        { id: "p-n3", title: "Kingdom of Small Hours", type: "novels", coverImage: "https://picsum.photos/seed/omniflix-pn3/120/180" },
        { id: "p-n4", title: "The Ninth Lemma", type: "novels", coverImage: "https://picsum.photos/seed/omniflix-pn4/120/180" },
        { id: "p-n5", title: "Farewell, Cygnus", type: "novels", coverImage: "https://picsum.photos/seed/omniflix-pn5/120/180" },
    ],
    movies: [
        { id: "p-m1", title: "Terminal Velocity Blues", type: "movies", coverImage: "https://picsum.photos/seed/omniflix-pm1/120/180" },
        { id: "p-m2", title: "The Cartel Room", type: "movies", coverImage: "https://picsum.photos/seed/omniflix-pm2/120/180" },
        { id: "p-m3", title: "Second Sun", type: "movies", coverImage: "https://picsum.photos/seed/omniflix-pm3/120/180" },
        { id: "p-m4", title: "Winter Harvest", type: "movies", coverImage: "https://picsum.photos/seed/omniflix-pm4/120/180" },
        { id: "p-m5", title: "Long Way to Neptune", type: "movies", coverImage: "https://picsum.photos/seed/omniflix-pm5/120/180" },
    ],
    series: [
        { id: "p-s1", title: "The Understudy", type: "series", coverImage: "https://picsum.photos/seed/omniflix-ps1/120/180" },
        { id: "p-s2", title: "Fault Lines", type: "series", coverImage: "https://picsum.photos/seed/omniflix-ps2/120/180" },
        { id: "p-s3", title: "Bright Water Bay", type: "series", coverImage: "https://picsum.photos/seed/omniflix-ps3/120/180" },
        { id: "p-s4", title: "The Sound of Static", type: "series", coverImage: "https://picsum.photos/seed/omniflix-ps4/120/180" },
        { id: "p-s5", title: "Dead Letter Office", type: "series", coverImage: "https://picsum.photos/seed/omniflix-ps5/120/180" },
    ],
};

/** Browsable grid for "Discover More". */
export const MOCK_DISCOVER: MediaItem[] = [
    ...MOCK_TRENDING,
    ...MOCK_RECOMMENDED,
    { id: "d1", title: "The Copper Meridian", type: "comics", coverImage: "https://picsum.photos/seed/omniflix-d1/300/450" },
    { id: "d2", title: "Saltwater Lullaby", type: "novels", coverImage: "https://picsum.photos/seed/omniflix-d2/300/450" },
    { id: "d3", title: "Cascade Point", type: "movies", coverImage: "https://picsum.photos/seed/omniflix-d3/300/450" },
    { id: "d4", title: "Thirteenth Winter", type: "series", coverImage: "https://picsum.photos/seed/omniflix-d4/300/450" },
];
