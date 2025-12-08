"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSettings } from "@/contexts/settings.context";
import { settingsService } from "@/services/settings.service";
import { BackupPoint } from "@/types/settings";
import { Loader2 } from "lucide-react";

export function DataBackupSetup() {
  const { backups, loading, error, refreshSettings } = useSettings();
  const [backupList, setBackupList] = useState<BackupPoint[]>([]);
  const [retentionPeriod, setRetentionPeriod] = useState("1");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    const fetchBackups = async () => {
      try {
        const backupData = await settingsService.getBackups();
        setBackupList(backupData);
      } catch (err) {
        console.error("Failed to fetch backups:", err);
      }
    };
    fetchBackups();
  }, []);

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      await settingsService.createBackup();
      await refreshSettings();
      // Refresh the list
      const backupData = await settingsService.getBackups();
      setBackupList(backupData);
    } catch (err) {
      console.error("Failed to create backup:", err);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (backup: BackupPoint) => {
    if (!confirm("Are you sure you want to restore this backup? Current data will be replaced.")) {
      return;
    }

    setIsRestoring(true);
    try {
      await settingsService.restoreBackup(backup.id);
      await refreshSettings();
      // Refresh the list
      const backupData = await settingsService.getBackups();
      setBackupList(backupData);
    } catch (err) {
      console.error("Failed to restore backup:", err);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Backup Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold">Database Backup</h3>
              <p className="text-sm text-muted-foreground">
                Last backup: {backupList[0]?.createdAt ? new Date(backupList[0].createdAt).toLocaleString() : "Never"}
              </p>
            </div>
            <Button onClick={handleBackupNow} disabled={isBackingUp}>
              {isBackingUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Backing up...
                </>
              ) : (
                "Backup Now"
              )}
            </Button>
          </div>

          <div className="mt-6 space-y-2">
            <h4 className="font-medium">Retention Period</h4>
            <Select
              value={retentionPeriod}
              onValueChange={setRetentionPeriod}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Year</SelectItem>
                <SelectItem value="3">3 Years</SelectItem>
                <SelectItem value="5">5 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backupList.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell>
                    {new Date(backup.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{backup.size ? `${backup.size} MB` : "N/A"}</TableCell>
                  <TableCell>
                    <span
                      className={
                        backup.status === "COMPLETED"
                          ? "text-green-600"
                          : backup.status === "IN_PROGRESS"
                          ? "text-blue-600"
                          : backup.status === "FAILED"
                          ? "text-red-600"
                          : backup.status === "RESTORED"
                          ? "text-purple-600"
                          : "text-gray-600"
                      }
                    >
                      {backup.status.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      onClick={() => handleRestore(backup)}
                      disabled={backup.status !== "COMPLETED" || isRestoring}
                    >
                      {isRestoring ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Restoring...
                        </>
                      ) : (
                        "Restore"
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
