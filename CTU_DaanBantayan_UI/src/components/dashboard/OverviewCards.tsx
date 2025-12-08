import {
  IconUsers,
  IconBook,
  IconChalkboard,
  IconClipboardList,
  IconTrendingUp,
  IconAlertTriangle,
} from "@tabler/icons-react";

import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MotionCardDash } from "../utils/motion-wrapper";
import { CardSkeleton } from "@/components/utils";
import { Role } from "@/types/api";

interface OverviewCardsProps {
  isLoading?: boolean;
  role: Role;
  stats?: {
    totalClasses?: number;
    totalSubjects?: number;
    totalStudents?: number;
    pendingGrades?: number;
    attendanceToRecord?: number;
    studentsInSection?: number;
    subjectsTaken?: number;
    presentCount?: number;
    absentCount?: number;
    lateCount?: number;
    lowGradesCount?: number;
  };
}

export function OverviewCards({ isLoading = false, role, stats }: OverviewCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (role === Role.TEACHER) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <MotionCardDash>
          <Card className="@container/card h-28 flex flex-col justify-between bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-card border-blue-200">
            <CardHeader className="p-3">
              <CardDescription className="text-md flex items-center gap-2">
                <IconChalkboard className="h-4 w-4 text-blue-600" />
                <span>Total Classes</span>
              </CardDescription>
              <CardTitle className="text-lg font-semibold tabular-nums text-blue-700">
                {stats?.totalClasses || 0}
              </CardTitle>
              <CardAction />
            </CardHeader>
          </Card>
        </MotionCardDash>

        <MotionCardDash>
          <Card className="@container/card h-28 flex flex-col justify-between bg-gradient-to-br from-green-50 to-green-100 dark:bg-card border-green-200">
            <CardHeader className="p-3">
              <CardDescription className="text-md flex items-center gap-2">
                <IconBook className="h-4 w-4 text-green-600" />
                <span>Total Subjects Handling</span>
              </CardDescription>
              <CardTitle className="text-lg font-semibold tabular-nums text-green-700">
                {stats?.totalSubjects || 0}
              </CardTitle>
              <CardAction />
            </CardHeader>
          </Card>
        </MotionCardDash>

        <MotionCardDash>
          <Card className="@container/card h-28 flex flex-col justify-between bg-gradient-to-br from-purple-50 to-purple-100 dark:bg-card border-purple-200">
            <CardHeader className="p-3">
              <CardDescription className="text-md flex items-center gap-2">
                <IconUsers className="h-4 w-4 text-purple-600" />
                <span>Total Students</span>
              </CardDescription>
              <CardTitle className="text-lg font-semibold tabular-nums text-purple-700">
                {stats?.totalStudents || 0}
              </CardTitle>
              <CardAction />
            </CardHeader>
          </Card>
        </MotionCardDash>

        <MotionCardDash>
          <Card className="@container/card h-28 flex flex-col justify-between bg-gradient-to-br from-orange-50 to-orange-100 dark:bg-card border-orange-200">
            <CardHeader className="p-2">
              <CardDescription className="text-md flex items-center gap-2">
                <IconClipboardList className="h-4 w-4 text-orange-600" />
                <span>Pending Grades</span>
              </CardDescription>
              <CardTitle className="text-lg font-semibold tabular-nums text-orange-700">
                {stats?.pendingGrades || 0}
              </CardTitle>
              <CardAction />
            </CardHeader>
          </Card>
        </MotionCardDash>

        <MotionCardDash>
          <Card className="@container/card h-35 flex flex-col justify-between bg-gradient-to-br from-red-50 to-red-100 dark:bg-card border-red-200">
            <CardHeader className="p-2">
              <CardDescription className="text-md flex items-center gap-2">
                <IconTrendingUp className="h-6 w-5 text-red-600" />
                <span>Attendance to Record</span>
              </CardDescription>
              <CardTitle className="text-lg font-semibold tabular-nums text-red-700">
                {stats?.attendanceToRecord || 0}
              </CardTitle>
              <CardAction />
            </CardHeader>
          </Card>
        </MotionCardDash>
      </div>
    );
  }

  if (role === Role.ADVISER) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <MotionCardDash>
          <Card className="@container/card h-28 flex flex-col justify-between bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-card border-blue-200">
            <CardHeader className="p-3">
              <CardDescription className="text-md flex items-center gap-2">
                <IconUsers className="h-4 w-4 text-blue-600" />
                <span>Total Students in Section</span>
              </CardDescription>
              <CardTitle className="text-lg font-semibold tabular-nums text-blue-700">
                {stats?.studentsInSection || 0}
              </CardTitle>
              <CardAction />
            </CardHeader>
          </Card>
        </MotionCardDash>

        <MotionCardDash>
          <Card className="@container/card h-28 flex flex-col justify-between bg-gradient-to-br from-green-50 to-green-100 dark:bg-card border-green-200">
            <CardHeader className="p-3">
              <CardDescription className="text-md flex items-center gap-2">
                <IconBook className="h-4 w-4 text-green-600" />
                <span>Total Subjects Taken by Section</span>
              </CardDescription>
              <CardTitle className="text-lg font-semibold tabular-nums text-green-700">
                {stats?.subjectsTaken || 0}
              </CardTitle>
              <CardAction />
            </CardHeader>
          </Card>
        </MotionCardDash>

        <MotionCardDash>
          <Card className="@container/card h-28 flex flex-col justify-between bg-gradient-to-br from-purple-50 to-purple-100 dark:bg-card border-purple-200">
            <CardHeader className="p-3">
              <CardDescription className="text-md flex items-center gap-2">
                <IconTrendingUp className="h-4 w-4 text-purple-600" />
                <span>Present / Absent / Late</span>
              </CardDescription>
              <CardTitle className="text-lg font-semibold tabular-nums text-purple-700">
                {stats?.presentCount || 0} / {stats?.absentCount || 0} / {stats?.lateCount || 0}
              </CardTitle>
              <CardAction />
            </CardHeader>
          </Card>
        </MotionCardDash>

        <MotionCardDash>
          <Card className="@container/card h-28 flex flex-col justify-between bg-gradient-to-br from-red-50 to-red-100 dark:bg-card border-red-200">
            <CardHeader className="p-2">
              <CardDescription className="text-md flex items-center gap-2">
                <IconAlertTriangle className="h-4 w-4 text-red-600" />
                <span>Students With Low Grades</span>
              </CardDescription>
              <CardTitle className="text-lg font-semibold tabular-nums text-red-700">
                {stats?.lowGradesCount || 0}
              </CardTitle>
              <CardAction />
            </CardHeader>
          </Card>
        </MotionCardDash>
      </div>
    );
  }

  return null;
}
