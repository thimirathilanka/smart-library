import { preflight } from "@/lib/api/cors";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api/http";
import { requireActiveMemberFromRequest } from "@/lib/api/mobile-auth";
import {
  countUnreadNotifications,
  listNotifications,
  markNotificationRead,
} from "@/lib/data/notifications";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  const member = await requireActiveMemberFromRequest(request);
  if (!member) return jsonError(request, "Unauthorized.", 401);

  const [notifications, unread] = await Promise.all([
    listNotifications(member._id),
    countUnreadNotifications(member._id),
  ]);
  return jsonOk(request, { notifications, unread });
}

export async function POST(request: Request) {
  const member = await requireActiveMemberFromRequest(request);
  if (!member) return jsonError(request, "Unauthorized.", 401);

  const body = await readJsonBody<{ id?: string; all?: boolean }>(request);
  if (!body) return jsonError(request, "Invalid JSON body.");

  if (body.all) {
    await markNotificationRead(member._id);
  } else if (body.id) {
    await markNotificationRead(member._id, String(body.id));
  } else {
    return jsonError(request, "Provide id or all=true.");
  }

  const unread = await countUnreadNotifications(member._id);
  return jsonOk(request, { success: true, unread });
}
