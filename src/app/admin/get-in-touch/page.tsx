import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Mail, Phone, Clock, MessageSquare } from "lucide-react";
import { createSupabaseBackendClient } from "@/lib/backend/adapters/supabase/client";
import { requireAdminPagePermission } from "@/lib/backend/auth/adminPageAccess.server";
import { markContactMessageRead } from "./actions";

export const metadata: Metadata = {
  title: "Get in Touch | Admin Dashboard",
};

export const revalidate = 0; // Disable caching to fetch live messages

interface ContactMessageRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  created_at: string;
  status: string | null;
}

export default async function AdminGetInTouchPage() {
  const access = await requireAdminPagePermission("settings.view");
  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      redirect("/admin/login?next=%2Fadmin%2Fget-in-touch");
    }
    notFound();
  }

  const supabase = createSupabaseBackendClient();

  const { data: rows, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching messages:", error);
  }
  const messages = (rows ?? []) as ContactMessageRow[];
  const unreadCount = messages.filter((message) => !message.status || message.status === "unread").length;

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Get in Touch</h1>
          <p className="text-sm text-slate-500 mt-1">Review and manage messages received from the public website.</p>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs font-semibold sm:flex-row sm:items-center sm:gap-2">
          <span className="rounded-xl bg-blue-50 px-4 py-2 text-blue-700">{messages.length} Total</span>
          <span className="rounded-xl bg-amber-50 px-4 py-2 text-amber-700">{unreadCount} Unread</span>
        </div>
      </div>

      {!messages || messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-slate-200 border-dashed rounded-2xl bg-slate-50">
          <MessageSquare className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No messages yet</h3>
          <p className="text-sm text-slate-500 text-center max-w-sm mt-1">
            When users submit the contact form on the public website, their messages will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {messages.map((msg) => (
            <div key={msg.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900">{msg.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                    {msg.email && <a href={`mailto:${msg.email}`} className="flex items-center gap-1.5 hover:text-blue-700"><Mail className="w-4 h-4 text-slate-400" /> {msg.email}</a>}
                    {msg.phone && <a href={`tel:${msg.phone}`} className="flex items-center gap-1.5 hover:text-blue-700"><Phone className="w-4 h-4 text-slate-400" /> {msg.phone}</a>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${!msg.status || msg.status === "unread" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                    {!msg.status || msg.status === "unread" ? "Unread" : msg.status === "read" ? "Read" : msg.status}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 whitespace-nowrap bg-slate-100 px-2.5 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(msg.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
                {msg.message}
              </div>
              {(!msg.status || msg.status === "unread") && (
                <form action={markContactMessageRead} className="mt-4 flex justify-end">
                  <input type="hidden" name="id" value={msg.id} />
                  <button type="submit" className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700">
                    Mark as read
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
