"use client";

import React, { useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AdminActionIcon } from "./AdminActionIcon";

export function AdminNotificationMenu() {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        <AdminActionIcon aria-label="Notifications" className="relative cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 size-2.5 rounded-full bg-slate-300 ring-2 ring-white dark:bg-slate-600 dark:ring-slate-800"></span>
        </AdminActionIcon>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Notifications</h3>
              <button disabled title="Notifications are not enabled yet" className="text-xs text-slate-400 font-medium cursor-not-allowed">Mark all as read</button>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              <div className="px-4 py-8 text-center">
                <Bell className="size-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-3">Notifications are not enabled yet.</p>
                <p className="text-xs text-slate-500 mt-1">Real alerts will appear here after the notification workflow is connected.</p>
              </div>
            </div>
            <div className="p-2 border-t border-slate-100 dark:border-slate-700">
              <button disabled title="Notifications are not enabled yet" className="w-full py-2 text-sm text-center text-slate-400 dark:text-slate-500 font-medium cursor-not-allowed">
                View All Notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
