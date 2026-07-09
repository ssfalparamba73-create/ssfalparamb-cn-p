import React from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ 
  title = "No data found", 
  description = "There are no records to display at this time.", 
  icon = <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />, 
  actionLabel, 
  onAction,
  className = "" 
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 ${className}`}>
      {icon}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
