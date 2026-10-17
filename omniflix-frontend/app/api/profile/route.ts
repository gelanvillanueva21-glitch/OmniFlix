import { prisma } from "@/service/prisma.service";
import { ApiError } from "@/service/client.service";
import { getCurrentUser } from "@/service/user.service";
import { cookies } from "next/headers";



export async function GET() {
    const cookieHeader = (await cookies()).toString();

    try {
        const user = await getCurrentUser({
            headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
        });
        const profile = await prisma.profile.findUnique({
            where: {
                userId: user.id,
            },
        });

        return Response.json({
            message: "Success",
            data: profile,
        });
    } catch (error) {
        if (error instanceof ApiError) {
            return Response.json(
                { message: "Profile not found" },
                { status: error.status },
            );
        }

        console.error("Profile API request failed", error);
        return Response.json(
            { message: "Profile service unavailable" },
            { status: 503 },
        );
    }
}

