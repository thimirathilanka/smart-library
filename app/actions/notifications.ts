"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { markNotificationRead } from "@/lib/data/notifications";

export async function markNotificationReadAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  await markNotificationRead(session.user.id, id);
  revalidatePath("/");
}

export async function markAllNotificationsReadAction() {
  const session = await auth();
  if (!session?.user?.id) return;
  await markNotificationRead(session.user.id);
  revalidatePath("/");
}
