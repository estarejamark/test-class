"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Clock, Users, BookOpen, Calculator, Calendar, Briefcase } from "lucide-react";
import { ScheduleResponse } from "@/types/api";

interface SelectClassSubjectComponentProps {
  onScheduleSelect?: (schedule: ScheduleResponse | null) => void;
  selectedSchedule?: ScheduleResponse | null;
  teacherSchedules: ScheduleResponse[];
  isLoadingSchedules: boolean;
  schedulesError: string | null;
  onNavigate?: (item: string, schedule?: ScheduleResponse) => void;
}

export default function SelectClassSubjectComponent({
  onScheduleSelect,
  selectedSchedule,
  teacherSchedules,
  isLoadingSchedules,
  schedulesError,
  onNavigate,
}: SelectClassSubjectComponentProps) {
  const [localSelectedSchedule, setLocalSelectedSchedule] = useState<ScheduleResponse | null>(
    selectedSchedule || null
  );

  useEffect(() => {
    setLocalSelectedSchedule(selectedSchedule || null);
  }, [selectedSchedule]);

  const handleScheduleSelect = (schedule: ScheduleResponse) => {
    const newSelection = localSelectedSchedule?.id === schedule.id ? null : schedule;
    setLocalSelectedSchedule(newSelection);
    onScheduleSelect?.(newSelection);
  };

  const formatTime = (timeString: string) => {
    // Convert "HH:mm" to a valid date string by prepending a date
    const date = new Date(`1970-01-01T${timeString}:00`);
    if (isNaN(date.getTime())) {
      // If invalid, return original string as fallback
      return timeString;
    }
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDayColor = (day: string) => {
    const colors = {
      'Monday': 'bg-blue-100 text-blue-800',
      'Tuesday': 'bg-green-100 text-green-800',
      'Wednesday': 'bg-purple-100 text-purple-800',
      'Thursday': 'bg-orange-100 text-orange-800',
      'Friday': 'bg-red-100 text-red-800',
      'Saturday': 'bg-indigo-100 text-indigo-800',
      'Sunday': 'bg-gray-100 text-gray-800',
    };
    return colors[day as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoadingSchedules) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading your schedule...</span>
      </div>
    );
  }

  if (schedulesError) {
    return (
      <Alert className="m-4">
        <AlertDescription>
          {schedulesError}
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (teacherSchedules.length === 0) {
    return (
      <div className="text-center p-8">
        <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedules Found</h3>
        <p className="text-gray-500">
          You don&apos;t have any assigned classes yet. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 px-4">
      {teacherSchedules.map((schedule) => (
        <Card
          key={schedule.id}
          className={`w-80 aspect-square cursor-pointer transition-all ${
            localSelectedSchedule?.id === schedule.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          }`}
          onClick={() => handleScheduleSelect(schedule)}
        >
          <CardHeader className="pb-3 flex items-center justify-between">
            <CardTitle className="text-lg">{schedule.subject.name}</CardTitle>
            <Badge className={getDayColor(schedule.days)}>{schedule.days}</Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{schedule.section.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate?.("encode-records", schedule);
                }}
                className="flex-1 text-xs"
              >
                <Calculator className="h-3 w-3 mr-1" />
                Encode Grades
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate?.("daily-attendance", schedule);
                }}
                className="flex-1 text-xs"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Mark Attendance
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
