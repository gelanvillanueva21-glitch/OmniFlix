import { ApiError } from "@/service/client.service";
import { prisma } from "@/service/prisma.service";
import { EntertainmentListType } from "@/service/types/profile.payload";
import { getCurrentUser } from "@/service/user.service";
import { cookies } from "next/headers";

const VALID_PURPOSES = new Set<EntertainmentListType>([
    "FAVORITE",
    "WATCHLIST",
    "COMPLETED",
    "ON_HOLD",
    "PLAN_TO_WATCH",
    "PLAN_TO_READ",
    "DROPPED",
]);

export async function GET(request: Request) {
    const purpose = new URL(request.url).searchParams.get("purpose");

    if (!purpose || !VALID_PURPOSES.has(purpose as EntertainmentListType)) {
        return Response.json(
            {
                message:
                    "A valid purpose query parameter is required.",
            },
            { status: 400 },
        );
    }

    try {
        const cookieHeader = (await cookies()).toString();
        const user = await getCurrentUser({
            headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
        });

        const entertainment = await prisma.entertainment.findMany({
            where: {
                profileOwner: {
                    userId: user.id,
                },
                purpose: purpose as EntertainmentListType,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return Response.json({
            message: "Success",
            data: entertainment,
        });
    } catch (error) {
        if (error instanceof ApiError)
            return Response.json(
                { message: "Authentication failed" },
                { status: error.status },
            );


        console.error("Entertainment API request failed", error);
        return Response.json(
            { message: "Entertainment service unavailable" },
            { status: 503 },
        );
    }
}

