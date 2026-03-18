"use server";

import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";

export async function getMyNotificationsAction() {
  const session = await getSession();
  if (!session) redirect("/login");

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function markNotificationReadAction(id: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)));

  revalidatePath("/lms/notifications");
  return { success: true };
}

export async function markAllNotificationsReadAction(_formData?: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, session.user.id));

  revalidatePath("/lms/notifications");
}

export async function getUnreadCountAction(): Promise<number> {
  const session = await getSession();
  if (!session) return 0;

  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, session.user.id),
        eq(notifications.isRead, false),
      ),
    );

  return rows.length;
}
