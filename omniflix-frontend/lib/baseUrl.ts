import {
  configuredEnvironmentValue,
  serverProviderUrl,
} from '../service/provider-client.service';

/**
 * Options for `resolveProviderBaseUrl`.
 *
 * One of the following strategies is selected in priority order:
 *
 * 1. `docker` — resolves via `serverProviderUrl` (localhost → Docker host
 *    rewrite). Requires `envVar`, `dockerHost`, and `dockerPort`.
 * 2. `simple` — reads the env var with `configuredEnvironmentValue` and
 *    optionally falls back to `defaultUrl`. Requires `envVar`.
 * 3. `jikanPath` — same as `simple` but additionally strips the
 *    `/top/anime` suffix that the Jikan proxy appends. Requires `envVar`.
 */
export interface ProviderBaseUrlOptions {
  /** Primary environment variable name (required for all strategies). */
  envVar: string;

  /**
   * Docker service hostname for localhost rewrites.
   * When provided together with `dockerPort`, strategy "docker" is used.
   */
  dockerHost?: string;

  /** Docker service port. Required when `dockerHost` is set. */
  dockerPort?: number;

  /**
   * Hard-coded fallback used only when the env var is absent and the
   * "docker" strategy is not active.
   */
  defaultUrl?: string;

  /**
   * When `true`, strips the `/top/anime` path suffix that the Jikan proxy
   * appends, reducing the URL to its bare origin + version prefix.
   */
  stripJikanPath?: boolean;

  /** Human-readable service name shown in error messages. */
  serviceName?: string;
}

/**
 * Resolves the base URL for a provider service from environment configuration.
 *
 * Selects the correct resolution strategy from `options` and throws a
 * descriptive error when the URL cannot be determined.
 *
 * @example — Docker-aware service (e.g. LNCrawl)
 * ```ts
 * resolveProviderBaseUrl({
 *   envVar: "NEXT_PUBLIC_LNCRAWL_API_URL",
 *   dockerHost: "lncrawl",
 *   dockerPort: 8181,
 *   serviceName: "LNCrawl",
 * });
 * ```
 *
 * @example — Plain URL with fallback (e.g. TMDB)
 * ```ts
 * resolveProviderBaseUrl({
 *   envVar: "NEXT_PUBLIC_TMDB_API_URL",
 *   defaultUrl: "https://api.themoviedb.org/3",
 *   serviceName: "TMDB",
 * });
 * ```
 *
 * @example — Jikan proxy with path stripping
 * ```ts
 * resolveProviderBaseUrl({
 *   envVar: "NEXT_PUBLIC_JIKAN_API_URL",
 *   stripJikanPath: true,
 *   serviceName: "Jikan",
 * });
 * ```
 */
export function resolveProviderBaseUrl(options: ProviderBaseUrlOptions): string {
  const {
    envVar,
    dockerHost,
    dockerPort,
    defaultUrl,
    stripJikanPath = false,
    serviceName = envVar,
  } = options;

  // Strategy 1: Docker-aware resolution (localhost → container host rewrite).
  if (dockerHost !== undefined && dockerPort !== undefined) {
    const url = serverProviderUrl(envVar, dockerHost, dockerPort);
    if (!url) {
      throw new Error(`${serviceName} URL is not configured (${envVar}).`);
    }
    return url;
  }

  // Strategy 2 & 3: Plain env var with optional path stripping.
  const raw = configuredEnvironmentValue(envVar) || defaultUrl;
  if (!raw) {
    throw new Error(`${serviceName} URL is not configured (${envVar}).`);
  }

  if (stripJikanPath) {
    const url = new URL(raw);
    const path =
      url.pathname.replace(/\/top\/anime\/?$/, "").replace(/\/$/, "") || "/v1";
    return `${url.origin}${path}`;
  }

  return raw.replace(/\/$/, "");
}

