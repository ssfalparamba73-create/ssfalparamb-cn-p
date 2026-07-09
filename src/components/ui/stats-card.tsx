import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, icon, trend, className = "" }: StatsCardProps) {
  return (
    <Card className={`overflow-hidden shadow-sm border-slate-200 dark:border-slate-800 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</h3>
            
            {trend && (
              <p className="text-xs mt-2 flex items-center gap-1">
                <span className={trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                  {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
                </span>
                <span className="text-slate-500">{trend.label}</span>
              </p>
            )}
          </div>
          {icon && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
