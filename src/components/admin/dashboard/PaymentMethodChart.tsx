import React from "react";
import { PieChart } from "lucide-react";

interface PaymentMethod {
  method: string;
  percentage: number;
  color: string;
}

interface PaymentMethodChartProps {
  data: PaymentMethod[];
}

const colorMap: Record<string, string> = {
  "bg-emerald-500": "#10b981",
  "bg-blue-500": "#3b82f6",
  "bg-amber-500": "#f59e0b",
  "bg-green-500": "#22c55e",
  "bg-red-500": "#ef4444",
  "bg-indigo-500": "#6366f1",
};

export function PaymentMethodChart({ data }: PaymentMethodChartProps) {
  const totalPercent = data.reduce((sum, item) => sum + item.percentage, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 dark:shadow-none h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">Payment Split</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">By channel</p>
        </div>
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg dark:bg-emerald-900/20 dark:text-emerald-400">
          <PieChart className="w-5 h-5" />
        </div>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8 mt-4">
        {/* SVG Donut Chart */}
        <div className="relative w-40 h-40 shrink-0">
          <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90 drop-shadow-sm">
            {/* Background Circle */}
            <circle
              cx="21" cy="21" r="15.91549430918954"
              fill="transparent"
              className="stroke-slate-100 dark:stroke-slate-700"
              strokeWidth="6"
            />
            {data.map((item, index) => {
              const dashArray = `${item.percentage} ${100 - item.percentage}`;
              const priorPercent = data
                .slice(0, index)
                .reduce((sum, entry) => sum + entry.percentage, 0);
              const dashOffset = 100 - priorPercent;
              const strokeColor = colorMap[item.color] || "#3b82f6";

              return (
                <circle
                  key={index}
                  cx="21" cy="21" r="15.91549430918954"
                  fill="transparent"
                  stroke={strokeColor}
                  strokeWidth="6"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  strokeLinecap={item.percentage < 100 ? "round" : "butt"}
                  className="transition-all duration-1000 ease-out hover:stroke-[7px] cursor-pointer"
                />
              );
            })}
          </svg>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">{totalPercent > 0 ? "100%" : "0%"}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full sm:w-auto flex-1 space-y-3">
          {data.map((item, index) => {
            const dotColor = colorMap[item.color] || "#3b82f6";
            return (
              <div key={index} className="flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors cursor-pointer -mx-2">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-3 shadow-sm transition-transform group-hover:scale-125"
                    style={{ backgroundColor: dotColor }}
                  ></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.method}</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
