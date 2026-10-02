"use server";

import { createSupabaseBackendClient } from "@/lib/backend/adapters/supabase/client";
import { consumePublicRateLimit } from "@/lib/backend/security/publicRateLimit.server";

export async function submitContactMessage(data: unknown) {
  try {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { success: false, error: "Please check the form and try again." };
    }
    const input = data as Record<string, unknown>;
    const name = typeof input.name === "string" ? input.name.trim() : "";
    const email = typeof input.email === "string" ? input.email.trim() : "";
    const phone = typeof input.phone === "string" ? input.phone.trim() : "";
    const message = typeof input.message === "string" ? input.message.trim() : "";

    if (
      !name || name.length > 120 ||
      !email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      phone.length > 32 ||
      !message || message.length > 5000
    ) {
      return { success: false, error: "Please check the form and try again." };
    }

    const withinLimit = await consumePublicRateLimit("contact-message", email, 5, 900);
    if (!withinLimit) {
      return { success: false, error: "Too many messages were submitted from this email. Please try again later." };
    }

    const supabase = createSupabaseBackendClient();
    
    const { error } = await supabase
      .from("contact_messages")
      .insert([
        {
          name,
          email,
          phone: phone || null,
          message,
          status: "unread",
        },
      ]);

    if (error) {
      console.error("Contact message insert failed.", { code: error.code });
      return { success: false, error: "Unable to send your message right now. Please try again." };
    }

    return { success: true };
  } catch {
    console.error("Contact submission failed.");
    return { success: false, error: "Unable to send your message right now. Please try again." };
  }
}
