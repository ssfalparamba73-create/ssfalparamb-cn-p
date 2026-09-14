"use server";

import { createServerClient } from "@/lib/backend/adapters/supabase/supabaseServer";

export async function submitContactMessage(data: { name: string; email: string; phone: string; message: string }) {
  try {
    const supabase = await createServerClient();
    
    const { error } = await supabase
      .from("contact_messages")
      .insert([
        {
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.message,
          status: "unread",
        },
      ]);

    if (error) {
      console.error("Supabase contact_messages error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Contact submission error:", err);
    return { success: false, error: "Internal server error" };
  }
}
