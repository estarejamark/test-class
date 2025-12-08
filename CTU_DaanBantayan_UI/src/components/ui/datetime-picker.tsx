"use client";

import * as React from "react";
import { CalendarDays, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DateTimePickerProps {
  label: string;
  value?: { date: string; time: string };
  onChange?: (value: { date: string; time: string }) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

export function DateTimePicker({
  label,
  value = { date: "", time: "" },
  onChange,
  placeholder = "Select date and time",
  required = false,
  id,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [internalDate, setInternalDate] = React.useState<string>(value.date);
  const [internalTime, setInternalTime] = React.useState<string>(value.time);

  const handleDateChange = (date: string) => {
    setInternalDate(date);
    onChange?.({ date, time: internalTime });
  };

  const handleTimeChange = (time: string) => {
    setInternalTime(time);
    onChange?.({ date: internalDate, time });
  };

  const formatDateTime = () => {
    if (!internalDate && !internalTime) return placeholder;

    const datePart = internalDate
      ? new Date(internalDate).toLocaleDateString()
      : "No date";
    const timePart = internalTime ? formatTime(internalTime) : "No time";

    return `${datePart} at ${timePart}`;
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };

  const applyChanges = () => {
    onChange?.({ date: internalDate, time: internalTime });
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="px-1">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            id={id}
            className="w-full justify-between font-normal">
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {formatDateTime()}
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select {label}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="date-input">Date</Label>
              <Input
                type="date"
                id="date-input"
                value={internalDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="time-input">Time</Label>
              <Input
                type="time"
                id="time-input"
                value={internalTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyChanges}>Apply</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simple time-only picker for cases where we only need time
interface TimePickerProps {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

export function TimePicker({
  label,
  value = "",
  onChange,
  placeholder = "HH:MM",
  required = false,
  id,
}: TimePickerProps) {
  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="px-1">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <Input
          type="time"
          id={id}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none pl-10"
          placeholder={placeholder}
          required={required}
        />
        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      {value && (
        <p className="text-xs text-muted-foreground px-1">
          {formatTime(value)}
        </p>
      )}
    </div>
  );
}
