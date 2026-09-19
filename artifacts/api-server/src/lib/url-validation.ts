const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const SAFE_LOCAL_IMAGE = /^\/images\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_.-]+)*$/;
const MEDIA_IMAGE = /^\/api\/media\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeHttpsUrl(value: string): URL | undefined {
  if (CONTROL_CHARACTERS.test(value)) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return undefined;
    if (url.href !== value) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

export function isSafeImageUrl(value: string): boolean {
  if (value === "") return true;
  if (MEDIA_IMAGE.test(value)) return true;
  if (value.startsWith("/images/")) {
    if (value.includes("\\") || value.includes("?") || value.includes("#") || CONTROL_CHARACTERS.test(value)) return false;
    return SAFE_LOCAL_IMAGE.test(value) &&
      !value.split("/").some((segment) => segment === "." || segment === "..");
  }
  return safeHttpsUrl(value) !== undefined;
}

export function isSafeSocialUrl(value: string, provider: "instagram" | "facebook"): boolean {
  if (value === "") return true;
  const url = safeHttpsUrl(value);
  if (!url) return false;
  const host = url.hostname.toLowerCase();
  const allowed = provider === "instagram"
    ? host === "instagram.com" || host === "www.instagram.com"
    : host === "facebook.com" || host === "www.facebook.com";
  return allowed;
}