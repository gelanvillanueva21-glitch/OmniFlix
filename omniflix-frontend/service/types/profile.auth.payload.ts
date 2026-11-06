export interface ProfileAuthResponse {
    id: number;
    user_id: number;
    display_name: string | null;
    profile_picture_url: string | null;
    created_at: string;
    updated_at: string | null;
}

export interface ProfilePictureDeleteResponse {
    status: string;
}
