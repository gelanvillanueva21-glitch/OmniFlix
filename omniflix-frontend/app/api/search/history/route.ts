import { ApiError } from "@/service/client.service";
import { prisma } from "@/service/prisma.service";
import { getCurrentUser } from "@/service/user.service";
import { cookies } from "next/headers";


export async function GET() {
    const cookieHeader = (await cookies()).toString();
    try {
        const user = await getCurrentUser({
            headers: cookieHeader ? { Cookie: cookieHeader } : undefined
        });
        const searchHistory = await prisma.searchHistory.findMany({
            where: {
                searchedOwner: {
                    userId: user.id
                }
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
                { message: "Authentication failed" },
                { status: error.status }
            );
        return Response.json(
            { message: "Search history unavailable" },
            { status: 503 }
        );
    }
}

