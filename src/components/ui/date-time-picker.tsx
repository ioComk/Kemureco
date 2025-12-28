"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type DateTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
};

const pad = (value: number) => String(value).padStart(2, "0");

const parseValue = (value: string) => {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = (datePart ?? "").split("-").map((item) => Number(item));
  const [hour = "00", minute = "00"] = (timePart ?? "00:00").split(":");
  if (!year || !month || !day) {
    return { date: undefined, hour: 0, minute: 0 };
  }
  return {
    date: new Date(year, month - 1, day, Number(hour), Number(minute)),
    hour: Number(hour),
    minute: Number(minute)
  };
};

const buildValue = (date: Date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const formatDisplay = (date?: Date) => {
  if (!date) return "YYYY/MM/DD HH:mm";
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  return `${month}/${day}/${date.getFullYear()} ${hour}:${minute}`;
};

export function DateTimePicker({ value, onChange, id, required }: DateTimePickerProps) {
  const parsed = React.useMemo(() => parseValue(value), [value]);
  const [date, setDate] = React.useState<Date | undefined>(parsed.date);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const next = parseValue(value);
    setDate(next.date);
  }, [value]);

  const handleDateSelect = (nextDate: Date | undefined) => {
    if (!nextDate) return;
    const current = date ?? new Date();
    nextDate.setHours(current.getHours(), current.getMinutes());
    setDate(nextDate);
    onChange(buildValue(nextDate));
  };

  const handleTimeChange = (type: "hour" | "minute", nextValue: string) => {
    const base = date ?? new Date();
    const next = new Date(base);
    if (type === "hour") {
      next.setHours(Number(nextValue));
    } else if (type === "minute") {
      next.setMinutes(Number(nextValue));
    }
    setDate(next);
    onChange(buildValue(next));
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  const currentHours = date?.getHours() ?? 0;
  const currentMinutes = date?.getMinutes() ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDisplay(date)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="sm:flex">
          <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus />
          <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {hours.map((hour) => (
                  <Button
                    key={hour}
                    size="icon"
                    variant={currentHours === hour ? "default" : "ghost"}
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() => handleTimeChange("hour", hour.toString())}
                  >
                    {pad(hour)}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {minutes.map((minute) => (
                  <Button
                    key={minute}
                    size="icon"
                    variant={currentMinutes === minute ? "default" : "ghost"}
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() => handleTimeChange("minute", minute.toString())}
                  >
                    {pad(minute)}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
      {id ? (
        <input
          id={id}
          name={id}
          type="datetime-local"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          className="sr-only"
        />
      ) : null}
    </Popover>
  );
}
