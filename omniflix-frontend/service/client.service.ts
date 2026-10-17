// Browser requests use the host-facing URL. Server-side requests use the
// Compose service name when available, because localhost means the frontend
// container itself inside Docker.
const FAST_API_URL =
    typeof window === "undefined"
        ? process.env.FAST_API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_FAST_API_URL
        : process.env.NEXT_PUBLIC_FAST_API_URL;


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


    return response.json() as Promise<T>;
}

