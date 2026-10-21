import { NextResponse } from "next/server";

const DEFAULT_ORIGINS = [
  "http://localhost:8081",
  "http://localhost:19006",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:19006",
];

function allowedOrigins() {
  const extra = (process.env.MOBILE_CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return [...DEFAULT_ORIGINS, ...extra];
}

export function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  const allowOrigin = allowedOrigins().includes(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Smart-Library-Client",
    "Access-Control-Max-Age": "86400",
  };
}

export function withCors(request: Request, response: NextResponse) {
  const headers = corsHeaders(request);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export function preflight(request: Request) {
  return withCors(request, new NextResponse(null, { status: 204 }));
}
