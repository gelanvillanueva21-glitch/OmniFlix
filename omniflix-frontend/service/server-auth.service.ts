import { cookies } from "next/headers";
import { ApiError } from "./client.service";
import { getCurrentUser } from "./user.service";

export async function getRequestUser() {
    const cookieHeader = (await cookies()).toString();

    try {
        return await getCurrentUser({
            headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
        });
    } catch (error) {
        if (error instanceof ApiError) return null;
        return null;
    }
}

export async function isAdminRequest(): Promise<boolean> {
    const user = await getRequestUser();
    return user?.role.trim().toLowerCase() === "admin";
}
