import { FastApiRequest } from "./client.service";
import type { ProfileAuthResponse, ProfilePictureDeleteResponse } from "./types/profile.auth.payload";

export function getProfile(options: RequestInit = {}): Promise<ProfileAuthResponse> {
    return FastApiRequest("profile/", options);
}

export function updateDisplayName(
    displayName: string,
    options: RequestInit = {},
): Promise<ProfileAuthResponse> {
    return FastApiRequest("profile/display-name", {
        ...options,
        method: "PUT",
        body: JSON.stringify({ display_name: displayName }),
    });
}

export function updateProfilePicture(
    picture: File,
    options: RequestInit = {},
): Promise<ProfileAuthResponse> {
    const formData = new FormData();
    formData.append("picture", picture);

    return FastApiRequest("profile/picture", {
        ...options,
        method: "PUT",
        body: formData,
    });
}

export function deleteProfilePicture(
    options: RequestInit = {},
): Promise<ProfilePictureDeleteResponse> {
    return FastApiRequest("profile/", {
        ...options,
        method: "DELETE",
    });
}
