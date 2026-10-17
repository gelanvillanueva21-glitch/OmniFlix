

import { FastApiRequest } from "./client.service";
import { UserAuth, UserResponse } from "./types/auth.payload";



export function signin(data: UserAuth): Promise<UserResponse> {
    return FastApiRequest(`auth/login`, {
        method: "POST",
        body: JSON.stringify(data)
    });
}


export function signup(data: UserAuth): Promise<UserResponse> {
    return FastApiRequest(`auth/register`, {
        method: "POST",
        body: JSON.stringify(data)
    });
}


export function getCurrentUser(options: RequestInit = {}): Promise<UserResponse> {
    return FastApiRequest(`auth/me`, options);
}


export function changePassword(
    currentPassword: string,
    newPassword: string
): Promise<{ message: string }> {
    return FastApiRequest(`auth/change-password`, {
        method: "PUT",
        body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
        })
    });
}


export function logout(): Promise<{ message: string }> {
    return FastApiRequest(`auth/logout`, { method: "POST" });
}

