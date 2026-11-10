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

const VALID_ENTERTAINMENT_TYPES = new Set<EntertainmentType>([
    "COMIC",
    "NOVEL",
    "MOVIE",
    "SERIES",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEntertainmentListType(
    value: unknown,
): value is EntertainmentListType {
    return typeof value === "string" && VALID_PURPOSES.has(value as EntertainmentListType);
}

function isEntertainmentType(value: unknown): value is EntertainmentType {
    return (
        typeof value === "string" &&
        VALID_ENTERTAINMENT_TYPES.has(value as EntertainmentType)
    );
}

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

    if (
        !isRecord(requestBody) ||
        typeof requestBody.externalId !== "string" ||
        requestBody.externalId.trim().length === 0 ||
        typeof requestBody.apiSource !== "string" ||
        requestBody.apiSource.trim().length === 0 ||
        !isEntertainmentListType(requestBody.purpose) ||
        !isEntertainmentType(requestBody.entertainmentType)
    ) {
        return Response.json(
            { message: "Missing or invalid required fields." },
            { status: 400 },
        );
    }

    const externalId = requestBody.externalId;
    const apiSource = requestBody.apiSource;
    const purpose = requestBody.purpose;
    const entertainmentType = requestBody.entertainmentType;

    try {
        const cookieHeader = (await cookies()).toString();
        const profile = await getProfile({
            headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
        });

        const entertainment = await prisma.entertainment.create({
            data: {
                profileId: profile.id,
                externalId,
                apiSource,
                purpose,
                entertainmentType,
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

    if (
        !isRecord(requestBody) ||
        typeof requestBody.id !== "number" ||
        !Number.isSafeInteger(requestBody.id) ||
        requestBody.id <= 0 ||
        !isEntertainmentListType(requestBody.purpose)
    ) {
        return Response.json(
            { message: "Missing or invalid required fields." },
            { status: 400 },
        );
    }

    const id = requestBody.id;
    const purpose = requestBody.purpose;

    try {
        const cookieHeader = (await cookies()).toString();
        const profile = await getProfile({
            headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
        });

        await prisma.entertainment.deleteMany({
            where: {
                id,
                profileId: profile.id,
                purpose,
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
