"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  captionLabelClassName?: string;
  dayClassName?: string;
  dayButtonClassName?: string;
  monthClassName?: string;
  monthsClassName?: string;
  rangeEndClassName?: string;
  rangeMiddleClassName?: string;
  rangeStartClassName?: string;
  selectedClassName?: string;
  disabledClassName?: string;
  outsideClassName?: string;
  todayClassName?: string;
};

function Calendar({ className, classNames, showOutsideDays = true, components: customComponents, ...props }: CalendarProps) {
  const _monthsClassName = cn("relative flex flex-col gap-4 sm:flex-row", props.monthsClassName);
  const _captionLabelClassName = cn("truncate text-sm font-medium", props.captionLabelClassName);

  const _dayClassName = cn(
    buttonVariants({ variant: "ghost" }),
    "size-9 rounded-md p-0 font-normal transition-none aria-selected:opacity-100",
    "flex flex-1 items-center justify-center text-sm",
    props.dayClassName,
    props.dayButtonClassName
  );

  const buttonRangeClassName =
    "bg-accent [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground";
  const _rangeStartClassName = cn(buttonRangeClassName, "rounded-s-md", props.rangeStartClassName);
  const _rangeEndClassName = cn(buttonRangeClassName, "rounded-e-md", props.rangeEndClassName);
  const _rangeMiddleClassName = cn(
    "bg-accent !text-foreground [&>button]:bg-transparent [&>button]:!text-foreground [&>button]:hover:bg-transparent [&>button]:hover:!text-foreground",
    props.rangeMiddleClassName
  );
  const _selectedClassName = cn(
    "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
    props.selectedClassName
  );
  const _todayClassName = cn("[&>button]:bg-accent [&>button]:text-accent-foreground", props.todayClassName);
  const _outsideClassName = cn(
    "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
    props.outsideClassName
  );
  const _disabledClassName = cn("text-muted-foreground opacity-50", props.disabledClassName);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        caption_label: _captionLabelClassName,
        day: _dayClassName,
        months: _monthsClassName,
        month: props.monthClassName,
        day_range_end: _rangeEndClassName,
        day_range_middle: _rangeMiddleClassName,
        day_range_start: _rangeStartClassName,
        day_selected: _selectedClassName,
        day_disabled: _disabledClassName,
        day_outside: _outsideClassName,
        day_today: _todayClassName,
        nav: "hidden",
        ...classNames
      }}
      components={customComponents}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
