"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface StatsCardProps {
  label: string;
  metric: string | number;
  helper?: string;
  icon?: LucideIcon;
  variant?: "default" | "success" | "warning" | "destructive";
  href?: string;
}

export function StatsCard({ 
  label, 
  metric, 
  helper, 
  icon: Icon,
  variant = "default",
  href
}: StatsCardProps) {
  
  const variantStyles = {
    default: "text-slate-900 dark:text-slate-50",
    success: "text-green-600",
    warning: "text-amber-600",
    destructive: "text-red-600",
  };

  const iconStyles = {
    default: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
    success: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-300",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
    destructive: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300",
  };

  const isClickable = !!href;

  const cardContent = (
    <Card className={cn(
      "h-full overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
      isClickable && "cursor-pointer transition-all duration-200 hover:-translate-y-px hover:border-slate-300 hover:shadow-md dark:hover:border-slate-700"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 space-y-1.5">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className={cn("font-mono text-2xl font-bold tabular-nums tracking-tight", variantStyles[variant])}>
                {metric}
              </h3>
            </div>
            {helper && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{helper}</p>
            )}
          </div>
          {Icon && (
            <div className={cn("ml-3 rounded-lg p-2", iconStyles[variant])}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isClickable) {
    return (
      <Link href={href} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
