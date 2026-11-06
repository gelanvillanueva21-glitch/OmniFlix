import { ApiError } from "@/service/client.service";
import { prisma } from "@/service/prisma.service";
import { getProfile } from "@/service/profile.auth.service";
import { cookies } from "next/headers";


export async function GET() {
    const cookieHeader = (await cookies()).toString();
    try {
        const profile = await getProfile({
            headers: cookieHeader ? { Cookie: cookieHeader } : undefined
        });
        const searchHistory = await prisma.searchHistory.findMany({
            where: {
                profileId: profile.id
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 100,
            select: {
                id: true,
                title: true,
                type: true,
                isGlobal: true,
                createdAt: true
            }
        });

        return Response.json({
            message: "Success",
            data: searchHistory
        });
    } catch (error) {
        if (error instanceof ApiError)
            return Response.json(
                {
                    message:
                        error.status === 404
                            ? "Profile not found"
                            : error.status === 401
                              ? "Authentication failed"
                              : "Profile service unavailable"
                },
                { status: error.status }
            );
        return Response.json(
            { message: "Search history unavailable" },
            { status: 503 }
        );
    }
}
