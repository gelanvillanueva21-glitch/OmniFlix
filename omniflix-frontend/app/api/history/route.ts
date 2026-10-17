import { ApiError } from "@/service/client.service";
import { prisma } from "@/service/prisma.service";
import { getCurrentUser } from "@/service/user.service";
import { cookies } from "next/headers";


export async function GET() {
    try {
        const cookieHeader = (await cookies()).toString();
        const user = await getCurrentUser({
            headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
        });

        const activity = await prisma.activity.findMany({
            where: {
                activityOwner: {
                    userId: user.id,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 100,
            select: {
                id: true,
                externalId: true,
                apiSource: true,
                type: true,
                hasRead: true,
                hasWatch: true,
                createdAt: true,
            },
        });

        return Response.json({
            message: "Success",
            data: activity,
        });
    } catch (error) {
        if (error instanceof ApiError) {
            return Response.json(
                { message: "Authentication failed" },
                { status: error.status },
            );
        }

        console.error("History API request failed", error);
        return Response.json(
            { message: "History service unavailable" },
            { status: 503 },
        );
    }
}

