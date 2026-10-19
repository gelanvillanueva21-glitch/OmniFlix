import { NextRequest, NextResponse } from "next/server";
import { configuredEnvironmentValue, serverProviderUrl } from "@/service/provider-client.service";

export async function GET(request: NextRequest) {
    const provider = request.nextUrl.searchParams.get("provider");
    let imageUrl: string | undefined;
    let headers: HeadersInit | undefined;

    if (provider === "suwayomi") {
        const path = request.nextUrl.searchParams.get("path");
        const baseUrl = serverProviderUrl("NEXT_PUBLIC_SUWAYOMI_API_URL", "suwayomi", 4567);

        if (
            !baseUrl || 
            !path || 
            (!path.startsWith("/") 
            && !path.startsWith("http"))
        ) 
            return new NextResponse(
                null, 
                { status: 400 }
            );

        imageUrl = path.startsWith("http") ? path : `${baseUrl}${path}`;
    } else if (provider === "kavita") {
        const identifier = request.nextUrl.searchParams.get("id");
        const baseUrl = serverProviderUrl(
            "NEXT_PUBLIC_KAVITA_API_URL", 
            "kavita", 
            5000
        );
        const apiKey = configuredEnvironmentValue(
            "KAVITA_API_KEY", 
            "NEXT_PUBLIC_KAVITA_KEY"
        );

        if (
            !baseUrl || 
            !identifier || 
            !apiKey || 
            !/^\d+$/.test(identifier)
        ) 
            return new NextResponse(null, { status: 400 });
        imageUrl = `${baseUrl}/api/Image/series-cover?seriesId=${identifier}`;
        headers = { "x-api-key": apiKey };
    }

    if (!imageUrl) 
        return new NextResponse(
            null, 
            { status: 400 }
        );

    try {

        const response = await fetch(
            imageUrl, 
            { 
                headers, 
                cache: "no-store" 
            }
        );

        if (!response.ok) 
            return new NextResponse(
                null, 
                { status: response.status }
            );

        return new NextResponse(
            await response.arrayBuffer(), 
            { headers: 
                { "Content-Type": response.headers.get("content-type") ?? 
                    "image/jpeg", "Cache-Control": 
                    "public, max-age=3600" }
                }
            );
            
    } catch {
        return new NextResponse(
            null, 
            { status: 502 }
        );
    }
}
