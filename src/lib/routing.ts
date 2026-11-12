/** Where to send someone after signing in when no specific page was requested. */
export function homeForRole(role?: string | null) {
  if (role === "ADMIN") return "/admin";
  if (role === "TEACHER") return "/dashboard";
  return "/search";
}

/** Only allow redirects back into this site. */
export function safeCallback(url?: string | null): string | null {
  return url && url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\") ? url : null;
}
