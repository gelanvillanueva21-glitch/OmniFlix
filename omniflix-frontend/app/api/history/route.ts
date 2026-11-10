import { ApiError } from "@/service/client.service";
import { getProfile } from "@/service/profile.auth.service";
import { prisma } from "@/service/prisma.service";
import { cookies } from "next/headers";

const VALID_ACTIVITY_TYPES = new Set(["COMIC", "NOVEL", "SERIES", "MOVIE"]);

interface ActivityRequest {
    externalId: string;
    apiSource: string;
    type: "COMIC" | "NOVEL" | "SERIES" | "MOVIE";
    hasRead?: boolean;
    hasWatch?: boolean;
}

function getProfileApiErrorResponse(error: ApiError): Response {
    const message =
        error.status === 401
            ? "Authentication failed."
            : error.status === 404
              ? "Profile not found."
              : "Profile service unavailable.";

    return Response.json({ message }, { status: error.status });
}

export async function GET() {
    try {
        const cookieHeader = (await cookies()).toString();
        const profile = await getProfile({
            headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
        });

        const activity = await prisma.activity.findMany({
            where: {
                profileId: profile.id,
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
        console.log("Hello World")
        return Response.json({
            message: "Success",
            data: activity,
        });
    } catch (error) {
        if (error instanceof ApiError) {
            return getProfileApiErrorResponse(error);
        }

        console.error("History API request failed", error);
        return Response.json(
            { message: "History service unavailable." },
            { status: 503 },
        );
    }
}

/**
 * Clears every recorded activity belonging to the authenticated profile.
 * The profile is resolved first so the delete is always scoped to the
 * signed-in user's own history rows.
 */
export async function DELETE() {
    try {
        const cookieHeader = (await cookies()).toString();
        const profile = await getProfile({
            headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
        });

        const result = await prisma.activity.deleteMany({
            where: {
                profileId: profile.id,
            },
        });

        return Response.json({
            message: "Activity history cleared successfully.",
            data: { deletedCount: result.count },
        });
    } catch (error) {
        if (error instanceof ApiError) {
            return getProfileApiErrorResponse(error);
        }

        console.error("History API request failed", error);
        return Response.json(
            { message: "Could not clear activity history." },
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
        typeof requestBody !== "object" ||
        requestBody === null ||
        Array.isArray(requestBody)
    ) {
        return Response.json(
            { message: "Request body must be a JSON object." },
            { status: 400 },
        );
    }

    const requestData = requestBody as Partial<ActivityRequest>;
    const externalId =
        typeof requestData.externalId === "string"
            ? requestData.externalId.trim()
            : "";
    const apiSource =
        typeof requestData.apiSource === "string"
            ? requestData.apiSource.trim()
            : "";
    const type = requestData.type;

    if (!externalId || !apiSource || typeof type !== "string") {
        return Response.json(
            {
                message:
                    "externalId, apiSource, and type are required non-empty strings.",
            },
            { status: 400 },
        );
    }

    if (!VALID_ACTIVITY_TYPES.has(type)) {
        return Response.json(
            { message: "type must be COMIC, NOVEL, SERIES, or MOVIE." },
            { status: 400 },
        );
    }

    if (
        (requestData.hasRead !== undefined &&
            typeof requestData.hasRead !== "boolean") ||
        (requestData.hasWatch !== undefined &&
            typeof requestData.hasWatch !== "boolean")
    ) {
        return Response.json(
            { message: "hasRead and hasWatch must be boolean values when provided." },
            { status: 400 },
        );
    }

    try {
        const profile = await getProfile({
            headers: { Cookie: request.headers.get("cookie") ?? "" },
        });

        const activity = await prisma.activity.create({
            data: {
                externalId,
                apiSource,
                type,
                ...(requestData.hasRead !== undefined
                    ? { hasRead: requestData.hasRead }
                    : {}),
                ...(requestData.hasWatch !== undefined
                    ? { hasWatch: requestData.hasWatch }
                    : {}),
                profileId: profile.id,
            },
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

        return Response.json(
            {
                message: "Activity recorded successfully.",
                data: activity,
            },
            { status: 201 },
        );
    } catch (error) {
        if (error instanceof ApiError) {
            return getProfileApiErrorResponse(error);
        }

        console.error("History API request failed", error);
        return Response.json(
            { message: "Could not record activity." },
            { status: 503 },
        );
    }
}
