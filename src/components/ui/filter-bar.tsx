import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface FilterBarProps {
  children?: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  className?: string;
}

export function FilterBar({ 
  children, 
  searchQuery, 
  onSearchChange, 
  searchPlaceholder = "Search...", 
  className = "" 
}: FilterBarProps) {
  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      {onSearchChange && (
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder={searchPlaceholder} 
            className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10"
            value={searchQuery || ""}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}
      {children}
    </div>
  );
}
