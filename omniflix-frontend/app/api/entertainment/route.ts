import { ApiError } from "@/service/client.service";
import { prisma } from "@/service/prisma.service";
import { getProfile } from "@/service/profile.auth.service";
import { EntertainmentListType, EntertainmentType } from "@/service/types/profile.payload";
import { cookies } from "next/headers";

const VALID_PURPOSES = new Set<EntertainmentListType>([
    "FAVORITE",
    "WATCHLIST",
    "READLIST",
    "COMPLETED",
    "ON_HOLD",
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
        const profile = await getProfile({
            headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
        })
        const entertainment = await prisma.entertainment.findMany({
            where: {
                profileId: profile.id,
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


type EntertanmentRequestBody = {
    externalId: string;
    apiSource: string;
    purpose: EntertainmentListType;
    entertainmentType: EntertainmentType;
}

export async function POST(request: Request) {
    let requestBody: unknown;
    try {
        requestBody = await request.json();
    } catch {
        return Response.json(
            { message: "Request body must be valid JSON." },
            { status: 400 },
        );
    }
    
    const data = requestBody as EntertanmentRequestBody;

    if (
        !data.externalId ||
        !data.apiSource ||
        !data.purpose ||
        !VALID_PURPOSES.has(data.purpose) ||
        !data.entertainmentType
    ) {
        return Response.json(
            { message: "Missing or invalid required fields." },
            { status: 400 },
        );
    }

    try {
        const cookieHeader = (await cookies()).toString();
        const profile = await getProfile({
            headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
        });

        const entertainment = await prisma.entertainment.create({
            data: {
                profileId: profile.id,
                externalId: data.externalId,
                apiSource: data.apiSource,
                purpose: data.purpose,
                entertainmentType: data.entertainmentType,
            },
            select: {
                id: true,
                externalId: true,
                apiSource: true,
                purpose: true,
                entertainmentType: true,
                createdAt: true,
            },
        });

        return Response.json({
            message: "Entertainment item added successfully.",
            data: entertainment,
        });
    }
    catch (error) {
        if (error instanceof ApiError) {
            return Response.json(
                { message: "Authentication failed" },
                { status: error.status },
            );
        }

        console.error("Entertainment API request failed", error);
        return Response.json(
            { message: "Entertainment service unavailable" },
            { status: 503 },
        );
    }
}


export async function DELETE(request: Request) {
    let requestBody: unknown;
    try {
        requestBody = await request.json();
    } catch {
        return Response.json(
            { message: "Request body must be valid JSON." },
            { status: 400 },
        );
    }

    const data = requestBody as { id: number; purpose: EntertainmentListType };
    
    if (
        !data.id || 
        !data.purpose || 
        !VALID_PURPOSES.has(data.purpose)
    ) {
        return Response.json(
            { message: "Missing or invalid required fields." },
            { status: 400 },
        );
    }

    try {
        const cookieHeader = (await cookies()).toString();
        const profile = await getProfile({
            headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
        });

        await prisma.entertainment.deleteMany({
            where: {
                id: data.id,
                profileId: profile.id,
                purpose: data.purpose,
            },
        });

        return Response.json({
            message: "Entertainment item deleted successfully."
        });
    }
    catch (error) {
        if (error instanceof ApiError) {
            return Response.json(
                { message: "Authentication failed" },
                { status: error.status },
            );
        }

        console.error("Entertainment API request failed", error);
        return Response.json(
            { message: "Entertainment service unavailable" },
            { status: 503 },
        );
    }
}
