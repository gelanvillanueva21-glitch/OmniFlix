// Browser requests use the host-facing URL. Server-side requests use the
// Compose service name when available, because localhost means the frontend
// container itself inside Docker.
const FAST_API_URL =
    typeof window === "undefined"
        ? process.env.FAST_API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_FAST_API_URL
        : process.env.NEXT_PUBLIC_FAST_API_URL;

const NEXT_API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ApiResponse<T> {
    message: string;
    data: T;
}

export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}


export async function FastApiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const isFormData = options.body instanceof FormData

    if (!FAST_API_URL) {
        throw new Error("FastAPI URL is not configured");
    }

    const response = await fetch(`${FAST_API_URL}/${path}`, {
        ...options,
        credentials: 'include',
        headers: {
            ...(!isFormData && {
                'Content-Type': 'application/json'
            }),
            ...options.headers
        }
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({
            detail: 'Unknown Error'
        }));
        throw new ApiError(response.status, body.detail ?? 'Request Failed');
    }


    // 204/205 have no body — response.json() would reject on empty content.
    if (response.status === 204 || response.status === 205) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}


export async function NextApiRequest<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const isFormData = options.body instanceof FormData;

    if (!NEXT_API_URL) {
        throw new Error("Next API URL is not configured");
    }

    const response = await fetch(`${NEXT_API_URL}/${path}`, {
        ...options,
        credentials: "include",
        headers: {
            ...(!isFormData && {
                "Content-Type": "application/json",
            }),
            ...options.headers,
        },
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({
            message: "Unknown Error",
        }));

        throw new ApiError(
            response.status,
            body.message ?? body.detail ?? "Request Failed",
        );
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

