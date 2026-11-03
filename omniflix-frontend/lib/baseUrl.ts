import { configuredEnvironmentValue } from '../service/provider-client.service';


export function resolveBaseUrl(): string {
  const configuredUrl = configuredEnvironmentValue("NEXT_PUBLIC_JIKAN_API_URL");
  if (!configuredUrl) {
    throw new Error("Jikan URL is not configured.");
  }

  const url = new URL(configuredUrl);
  const path =
    url.pathname.replace(/\/top\/anime\/?$/, "").replace(/\/$/, "") || "/v1";
  return `${url.origin}${path}`;
}
