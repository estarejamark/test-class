"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, CheckCircle, Clock, XCircle, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { attendanceService } from "@/services/attendance.service";
import { enrollmentService, EnrolledStudentResponse } from "@/services/enrollment.service";
import { AttendanceStatus, AttendanceRecord, BulkAttendanceRequest } from "@/types/attendance";
import { ScheduleResponse, Quarter } from "@/types/api";
import { useAuth } from "@/contexts/auth.context";
import { useSettings } from "@/contexts/settings.context";
import { toast } from "sonner";

interface AttendanceComponentProps {
  selectedSchedule: ScheduleResponse | null;
}

interface StudentAttendance {
  studentId: string;
  studentName: string;
  currentStatus: AttendanceStatus;
  existingRecord?: AttendanceRecord;
}

export default function AttendanceComponent({ selectedSchedule }: AttendanceComponentProps) {
  const { user } = useAuth();
  const { activeQuarter } = useSettings();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudentResponse[]>([]);

  // Load enrolled students when schedule changes
  useEffect(() => {
    if (selectedSchedule?.section.id) {
      loadEnrolledStudents();
    }
  }, [selectedSchedule]);

  // Load attendance data when date or students change
  useEffect(() => {
    if (enrolledStudents.length > 0 && selectedDate) {
      loadAttendanceData();
    }
  }, [enrolledStudents, selectedDate]);

  const loadEnrolledStudents = async () => {
    if (!selectedSchedule?.section.id) return;

    try {
      setLoading(true);
      const enrolled = await enrollmentService.getEnrolledStudents(selectedSchedule.section.id);
      setEnrolledStudents(enrolled);

      // Initialize student attendance array
      const initialStudents: StudentAttendance[] = enrolled.map(student => ({
        studentId: student.studentId,
        studentName: student.studentName,
        currentStatus: AttendanceStatus.PRESENT, // Default to present
      }));
      setStudents(initialStudents);
    } catch (error) {
      console.error("Failed to load enrolled students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceData = async () => {
    if (!selectedSchedule?.section.id || !selectedDate) return;

    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const existingRecords = await attendanceService.getSectionAttendanceByDate(
        selectedSchedule.section.id,
        dateStr
      );

      // Update students with existing attendance data
      const updatedStudents = students.map(student => {
        const existingRecord = existingRecords.find(record => record.studentId === student.studentId);
        return {
          ...student,
          currentStatus: existingRecord?.status || AttendanceStatus.PRESENT,
          existingRecord,
        };
      });

      setStudents(updatedStudents);
    } catch (error) {
      console.error("Failed to load attendance data:", error);
      // If no records exist, that's fine - students will have default status
    }
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev =>
      prev.map(student =>
        student.studentId === studentId
          ? { ...student, currentStatus: status }
          : student
      )
    );
  };

  const handleSaveAttendance = async () => {
    if (!selectedSchedule?.section.id || !selectedDate || !activeQuarter) return;

    // Prevent future date attendance marking
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);

    if (selectedDateOnly > today) {
      toast.error("Cannot mark attendance for future dates");
      return;
    }

    try {
      setSaving(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const currentQuarter = activeQuarter.activeQuarter;

      const attendanceRecords = students.map(student => ({
        studentId: student.studentId,
        status: student.currentStatus,
      }));

      const request: BulkAttendanceRequest = {
        sectionId: selectedSchedule.section.id,
        quarter: currentQuarter,
        attendanceDate: dateStr,
        attendanceRecords,
      };

      await attendanceService.createBulkAttendance(request);
      toast.success("Attendance saved successfully");

      // Reload data to get updated records
      await loadAttendanceData();
    } catch (error) {
      console.error("Failed to save attendance:", error);
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case AttendanceStatus.ABSENT:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case AttendanceStatus.LATE:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return "default";
      case AttendanceStatus.ABSENT:
        return "destructive";
      case AttendanceStatus.LATE:
        return "secondary";
      default:
        return "outline";
    }
  };

  if (!selectedSchedule) {
    return (
      <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <Alert>
            <AlertDescription>
              Please select a class and subject first to mark attendance.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Header */}
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Daily Attendance</h2>
            <p className="text-muted-foreground">
              {selectedSchedule.subject.name} - {selectedSchedule.section.name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleSaveAttendance} disabled={saving || students.length === 0}>
              {saving ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {students.filter(s => s.currentStatus === AttendanceStatus.PRESENT).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {students.filter(s => s.currentStatus === AttendanceStatus.ABSENT).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {students.filter(s => s.currentStatus === AttendanceStatus.LATE).length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attendance List */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Attendance</CardTitle>
            <CardDescription>
              Mark attendance for {format(selectedDate, "EEEE, MMMM do, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No students enrolled in this section
              </div>
            ) : (
              <div className="space-y-4">
                {students.map((student) => (
                  <div
                    key={student.studentId}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(student.currentStatus)}
                      <div>
                        <p className="font-medium">{student.studentName}</p>
                        <p className="text-sm text-muted-foreground">ID: {student.studentId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={getStatusBadgeVariant(student.currentStatus)}>
                        {student.currentStatus}
                      </Badge>
                      <RadioGroup
                        value={student.currentStatus}
                        onValueChange={(value) => handleStatusChange(student.studentId, value as AttendanceStatus)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={AttendanceStatus.PRESENT} id={`${student.studentId}-present`} />
                          <Label htmlFor={`${student.studentId}-present`} className="text-green-600">Present</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={AttendanceStatus.LATE} id={`${student.studentId}-late`} />
                          <Label htmlFor={`${student.studentId}-late`} className="text-yellow-600">Late</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={AttendanceStatus.ABSENT} id={`${student.studentId}-absent`} />
                          <Label htmlFor={`${student.studentId}-absent`} className="text-red-600">Absent</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
