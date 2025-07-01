// components/TrendIndicator.tsx
"use client";
import { formatPercentage } from "@/lib/format";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
interface TrendIndicatorProps {
  value: number; // Giá trị phần trăm (vd: 5.2 hoặc -3.1)
  className?: string;
}

export function TrendIndicator({ value, className = "" }: TrendIndicatorProps) {
  const isPositive = value >= 0;
  
  return (
    <div className={`inline-flex items-center ${className}`}>
      {isPositive ? (
        <ArrowUpIcon className="w-4 h-4 text-green-500" />
      ) : (
        <ArrowDownIcon className="w-4 h-4 text-red-500" />
      )}
      <span className={`ml-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {formatPercentage(value)}
      </span>
    </div>
  );
}