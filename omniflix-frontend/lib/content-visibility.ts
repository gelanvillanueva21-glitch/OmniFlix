import type { UserResponse } from "@/service/types/auth.payload";
import type { MediaItem } from "./media";

/** Restricted labels are normalized before comparison. */
export const RESTRICTED_GENRES = [
    "hentai",
    "smut",
    "adult",
    "pornographic",
    "pornography",
    "erotica",
    "adult only",
    "mature sexual content",
] as const;

export type RestrictedContentVisibility = "allow" | "blur" | "hide";

/** Trim and case-fold provider genre/tag labels for stable comparisons. */
export function normalizeGenreName(name: string): string {
    return name.trim().toLowerCase();
}

/**
 * Only explicit provider genres trigger restriction. Missing or unusable
 * metadata remains unclassified because it is not proof of adult content.
 */
export function isRestrictedMedia(media: Pick<MediaItem, "genres">): boolean {
    const genres = media.genres
        ?.map(normalizeGenreName)
        .filter((genre) => genre.length > 0);

    if (genres === undefined || genres.length === 0) return false;

    return genres.some((genre) =>
        (RESTRICTED_GENRES as readonly string[]).includes(genre),
    );
}

/** Admin is the only current authenticated exception. */
export function isAdminUser(user: UserResponse | null): boolean {
    return user?.role.trim().toLowerCase() === "admin";
}

/**
 * Age verification is not implemented yet. Keep this false until the backend
 * supplies a trusted verification result; never infer age from user input.
 */
export function isAgeVerifiedAdultUser(user: UserResponse): boolean {
    void user;
    return false;
}

export function getRestrictedContentVisibility(
    user: UserResponse | null,
    isAuthLoading: boolean,
): RestrictedContentVisibility {
    // Hide while authentication is unresolved so restricted content is never
    // briefly exposed to a logged-in non-admin user.
    if (isAuthLoading) return "hide";
    if (user === null) return "blur";
    if (isAdminUser(user) || isAgeVerifiedAdultUser(user)) return "allow";
    return "hide";
}

export function filterRestrictedMedia(
    items: MediaItem[],
    visibility: RestrictedContentVisibility,
): MediaItem[] {
    if (visibility !== "hide") return items;
    return items.filter((item) => !isRestrictedMedia(item));
}
