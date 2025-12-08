import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Users, MessageSquare, BarChart3, UserCheck } from "lucide-react";
import { GradeReportsComponent } from "./reports/GradeReportsComponent";
import { AttendanceReportsComponent } from "./reports/AttendanceReportsComponent";
import { FeedbackReportsComponent } from "./reports/FeedbackReportsComponent";
import { TeacherLoadReportsComponent } from "./reports/TeacherLoadReportsComponent";
import { UsageStatsComponent } from "./reports/UsageStatsComponent";

export function ReportsComponent() {
  const [activeTab, setActiveTab] = useState("grades");

  const reportTabs = [
    {
      id: "grades",
      label: "Grade Reports",
      icon: TrendingUp,
      description: "Academic performance and grade analysis",
      component: GradeReportsComponent,
    },
    {
      id: "attendance",
      label: "Attendance Reports",
      icon: Users,
      description: "Student attendance patterns and rates",
      component: AttendanceReportsComponent,
    },
    {
      id: "feedback",
      label: "Feedback Reports",
      icon: MessageSquare,
      description: "Student feedback and comments",
      component: FeedbackReportsComponent,
    },
    {
      id: "teacher-load",
      label: "Teacher Load",
      icon: FileText,
      description: "Teacher workload distribution",
      component: TeacherLoadReportsComponent,
    },
    {
      id: "usage-stats",
      label: "Usage Statistics",
      icon: BarChart3,
      description: "System usage and activity metrics",
      component: UsageStatsComponent,
    },
  ];

  return (
    <>
      <div className="h-6" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="bg-card text-card-foreground rounded-xl border shadow-sm">
          <div className="p-6">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-semibold leading-none tracking-tight">
                Reports
              </h2>
              <p className="text-sm text-muted-foreground">Generate comprehensive reports for academic insights and system analytics</p>
            </div>
          </div>
          <div className="p-6 pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 rounded-none border-b">
                {reportTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-2 data-[state=active]:bg-background"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {reportTabs.map((tab) => {
                const Component = tab.component;
                return (
                  <TabsContent key={tab.id} value={tab.id} className="p-6">
                    <Component />
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
