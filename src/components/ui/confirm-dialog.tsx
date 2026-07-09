import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={!isLoading ? onCancel : undefined} 
      />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full shrink-0 ${isDestructive ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 mt-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
          </div>
          
          <div className="mt-8 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              {cancelLabel}
            </Button>
            <Button 
              onClick={onConfirm} 
              disabled={isLoading}
              className={isDestructive ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              {isLoading ? "Processing..." : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
