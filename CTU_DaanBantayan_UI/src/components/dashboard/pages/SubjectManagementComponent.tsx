import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SubjectManagementComponent() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Subject Management</CardTitle>
            <CardDescription>
              Manage subjects offered, curricula, and course requirements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Subject management functionality will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
