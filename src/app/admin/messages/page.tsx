import { Metadata } from "next";
import { Mail, Phone, Clock, MessageSquare } from "lucide-react";
import { createSupabaseBackendClient } from "@/lib/backend/adapters/supabase/client";

export const metadata: Metadata = {
  title: "Contact Messages | Admin Dashboard",
};

export const revalidate = 0; // Disable caching to fetch live messages

export default async function AdminMessagesPage() {
  const supabase = createSupabaseBackendClient();

  const { data: messages, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching messages:", error);
  }

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Contact Messages</h1>
          <p className="text-sm text-slate-500 mt-1">View messages received from the public Get in Touch form.</p>
        </div>
        <div className="flex items-center justify-center h-10 px-4 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm">
          {messages?.length || 0} Total
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
          {messages.map((msg: any) => (
            <div key={msg.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900">{msg.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" /> {msg.email}</span>
                    {msg.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400" /> {msg.phone}</span>}
                  </div>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 whitespace-nowrap bg-slate-100 px-2.5 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(msg.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
                {msg.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
