import React from "react";
import { Calendar, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Displays the live special-event DTO shape.
interface SpecialEvent {
  id: string;
  name: string;
  status: "active" | "inactive";
  minAmount: number;
  month: string;
  theme?: string;
}

interface EventCardProps {
  event: SpecialEvent;
  onEdit?: (event: SpecialEvent) => void;
  onDelete?: (event: SpecialEvent) => void;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-500 mb-4">
        <Calendar className="w-6 h-6" />
      </div>
      
      <div className="flex items-center gap-3 mb-2">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 leading-none">{event.name}</h3>
        <Badge variant={event.status === "active" ? "success" : "secondary"} className="h-5 px-1.5 text-[10px]">
          {event.status === "active" ? "Active" : "Inactive"}
        </Badge>
      </div>
      
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6">
        <div>Min: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">₹{event.minAmount}</span></div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {event.month}
        </div>
        {event.theme && (
          <div className="font-medium text-amber-600 dark:text-amber-400">
            {event.theme}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-700/60">
        <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
}
