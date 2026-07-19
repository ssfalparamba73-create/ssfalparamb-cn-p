"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import type { MemberDTO } from "@/lib/backend/dto/member.dto";
import { getAdminMembers } from "@/lib/api/memberClient";

export function AdminSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || query.trim().length < 2) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      getAdminMembers(1, 10, query)
        .then((result) => { if (active) { setResults(result.items); setError(null); } })
        .catch((searchError) => { if (active) setError(searchError instanceof Error ? searchError.message : "Search failed."); })
        .finally(() => { if (active) setIsSearching(false); });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [isOpen, query]);

  const openMember = (id: string) => {
    onClose();
    setQuery("");
    router.push(`/admin/members/${id}`);
  };

  return (
    <AnimatePresence>
      {isOpen && <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm dark:bg-slate-950/40" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center p-2 border-b border-slate-100 dark:border-slate-800">
              <Search className="size-5 ml-3 text-slate-400" />
              <Input autoFocus value={query} onChange={(event) => { const value = event.target.value; setQuery(value); if (value.trim().length < 2) { setResults([]); setError(null); } }} placeholder="Search members by name, member ID, or phone..." className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-base h-12 shadow-none" />
              <button type="button" onClick={onClose} aria-label="Close search" className="p-2 mr-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"><X className="size-5" /></button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {query.trim().length < 2 && <div className="p-4 text-center py-12 text-sm text-slate-500">Enter at least 2 characters to search members.</div>}
              {isSearching && <div className="p-4 text-center py-8 text-sm text-slate-500">Searching...</div>}
              {error && <div role="alert" className="p-4 text-center py-8 text-sm text-red-600">{error}</div>}
              {!isSearching && !error && query.trim().length >= 2 && results.length === 0 && <div className="p-4 text-center py-8 text-sm text-slate-500">No matching members found.</div>}
              {!isSearching && results.map((member) => <button type="button" key={member.id} onClick={() => openMember(member.id)} className="w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"><span className="block font-medium text-slate-900 dark:text-slate-100">{member.name}</span><span className="text-xs text-slate-500">{member.memberCode} · {member.phone}</span></button>)}
            </div>
          </div>
        </motion.div>
      </>}
    </AnimatePresence>
  );
}
