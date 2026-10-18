import { NextResponse } from "next/server";
import { withCors } from "@/lib/api/cors";

export function jsonOk(request: Request, data: unknown, init?: { status?: number }) {
  return withCors(request, NextResponse.json(data, { status: init?.status ?? 200 }));
}

export function jsonError(request: Request, error: string, status = 400) {
  return withCors(request, NextResponse.json({ error }, { status }));
}

export async function readJsonBody<T extends Record<string, unknown>>(request: Request) {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
