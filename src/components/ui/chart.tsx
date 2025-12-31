"use client";

import * as React from "react";
import { Tooltip as RechartsTooltip } from "recharts";

import { cn } from "@/lib/utils";

type ChartConfig = Record<
  string,
  {
    label?: string;
    color?: string;
  }
>;

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { config?: ChartConfig }
>(({ className, config, style, ...props }, ref) => {
  const configStyles = config
    ? Object.entries(config).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value?.color) {
          acc[`--color-${key}`] = value.color;
        }
        return acc;
      }, {})
    : {};

  return <div ref={ref} className={cn("w-full", className)} style={{ ...configStyles, ...style }} {...props} />;
});
ChartContainer.displayName = "ChartContainer";

const ChartTooltip = RechartsTooltip;

type ChartTooltipContentProps = {
  active?: boolean;
  payload?: Array<{ dataKey?: string | number; name?: string; value?: number }>;
  label?: string | number;
  valueSuffix?: string;
};

const ChartTooltipContent = ({ active, payload, label, valueSuffix }: ChartTooltipContentProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border bg-background p-2 text-xs shadow-sm">
      {label ? <div className="font-medium">{label}</div> : null}
      <div className="mt-1 space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey?.toString()} className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{entry.name ?? entry.dataKey}</span>
            <span>
              {entry.value}
              {valueSuffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export { ChartContainer, ChartTooltip, ChartTooltipContent };
