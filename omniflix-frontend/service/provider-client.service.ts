const REQUEST_TIMEOUT_MS = 8000;

export class ProviderRequestError extends Error {
    readonly status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = "ProviderRequestError";
        this.status = status;
    }
}

export async function providerRequest<T>(
    url: string,
    options: RequestInit = {},
): Promise<T> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            ...options,
            signal: abortController.signal,
            headers: {
                Accept: "application/json",
                ...options.headers,
            },
            cache: "no-store",
        });

        if (!response.ok) {
            throw new ProviderRequestError(
                `Provider request failed with status ${response.status}.`,
                response.status,
            );
        }

        return (await response.json()) as T;
    } catch (error) {
        if (error instanceof ProviderRequestError) throw error;
        if (error instanceof Error && error.name === "AbortError") {
            throw new ProviderRequestError("Provider request timed out.");
        }
        throw new ProviderRequestError("Provider could not be reached.");
    } finally {
        clearTimeout(timeout);
    }
}

export function configuredEnvironmentValue(
    ...environmentNames: string[]
): string | undefined {
    for (const environmentName of environmentNames) {
        const value = process.env[environmentName]?.trim();
        if (value) 
            return value;
    }
    return undefined;
}

export function serverProviderUrl(
    environmentName: string,
    dockerServiceName: string,
    dockerPort: number,
): string | undefined {
    const configuredUrl = configuredEnvironmentValue(environmentName);
    if (!configuredUrl) 
        return undefined;

    try {
        const url = new URL(configuredUrl);
        if (
            url.hostname === "localhost" || 
            url.hostname === "127.0.0.1"
        ) {
            url.hostname = dockerServiceName;
            url.port = String(dockerPort);
        }
        return url.toString().replace(/\/$/, "");
    } catch {
        throw new ProviderRequestError(`${environmentName} is not a valid URL.`);
    }
}

export function uniqueMediaItems<T extends { id: string }>(items: T[]): T[] {
    const uniqueItems = new Map<string, T>();

    for (const item of items) {
        uniqueItems.set(item.id, item);
    }

    return [...uniqueItems.values()];
}
