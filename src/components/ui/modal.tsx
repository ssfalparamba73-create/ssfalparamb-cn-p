import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children, 
  footer,
  maxWidth = "md" 
}: ModalProps) {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div 
          className={`w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200`}
        >
          {title && (
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
                {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full shrink-0 ml-4">
                <X className="w-5 h-5" />
              </Button>
            </div>
          )}
          
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh]">
            {children}
          </div>
          
          {footer && (
            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-b-xl flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
