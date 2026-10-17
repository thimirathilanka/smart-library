export function safeCallbackPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  try {
    const url = new URL(value, "http://localhost");
    if (url.origin !== "http://localhost") return "/";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/";
  }
}
