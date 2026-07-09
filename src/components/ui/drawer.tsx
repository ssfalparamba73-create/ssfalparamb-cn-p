import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Drawer({ isOpen, onClose, title, icon, children, footer }: DrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 transform transition-transform animate-in slide-in-from-right duration-300 flex flex-col">
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              {icon}
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
        
        {footer && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
