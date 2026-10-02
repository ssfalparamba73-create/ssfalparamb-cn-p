"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPagePermission } from "@/lib/backend/auth/adminPageAccess.server";
import { createSupabaseBackendClient } from "@/lib/backend/adapters/supabase/client";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function markContactMessageRead(formData: FormData) {
  const access = await requireAdminPagePermission("settings.view");
  if (!access.ok) throw new Error("You are not allowed to update contact messages.");

  const id = formData.get("id");
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) {
    throw new Error("Invalid contact message.");
  }

  const { error } = await createSupabaseBackendClient()
    .from("contact_messages")
    .update({ status: "read" })
    .eq("id", id)
    .eq("status", "unread");

  if (error) throw new Error("Unable to update the contact message.");
  revalidatePath("/admin/get-in-touch");
  revalidatePath("/admin/messages");
}
