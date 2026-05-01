/* eslint-disable react/prop-types */
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import { DateField } from "@/components/DateField";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save, RefreshCw } from "lucide-react";

const STATUS_OPTIONS = ["present", "absent", "late", "half_day", "on_leave"];

const statusVariant = {
  present:  "default",
  late:     "secondary",
  absent:   "destructive",
  half_day: "secondary",
  on_leave: "outline",
};

export default function AttendancePage() {
  const axiosPrivate = useAxiosPrivate();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [edits, setEdits] = useState({});
  const [savingId, setSavingId] = useState(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["attendance", date],
    queryFn: async () => {
      const res = await axiosPrivate.get("/hr/attendance", {
        params: { date, start: 0, size: 200 },
      });
      return res.data?.data ?? {};
    },
  });

  const { data: staffData } = useQuery({
    queryKey: ["all-staff-for-attendance"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/business/employees");
      return res.data?.data?.users ?? [];
    },
    staleTime: 60_000,
  });

  const { mutate: saveRecord, isPending } = useMutation({
    mutationFn: async (payload) => {
      const res = await axiosPrivate.post("/hr/attendance", [payload]);
      return res.data;
    },
    onSuccess: (_, vars) => {
      toast({ title: "Saved", description: `Attendance saved for ${vars.user_name}` });
      setEdits((prev) => { const n = { ...prev }; delete n[vars.user_id]; return n; });
      refetch();
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.response?.data?.messages ?? "Failed to save",
        variant: "destructive",
      });
    },
  });

  const records = data?.data ?? [];
  const recordsByUser = Object.fromEntries(records.map((r) => [r.user_id, r]));
  const staff = staffData ?? [];

  const getEdit = (userId, field, defaultVal) =>
    edits[userId]?.[field] !== undefined ? edits[userId][field] : (recordsByUser[userId]?.[field] ?? defaultVal);

  const setEdit = (userId, field, val) =>
    setEdits((prev) => ({ ...prev, [userId]: { ...prev[userId], [field]: val } }));

  const handleSave = (emp) => {
    setSavingId(emp.user_id);
    saveRecord({
      user_id:         emp.user_id,
      user_name:       `${emp.user_firstname} ${emp.user_lastname}`,
      attendance_date: date,
      status:          getEdit(emp.user_id, "status", "present"),
      check_in:        getEdit(emp.user_id, "check_in", "") || null,
      check_out:       getEdit(emp.user_id, "check_out", "") || null,
      notes:           getEdit(emp.user_id, "notes", "") || null,
    });
  };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Attendance</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-4 pt-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-48">
            <DateField label="Date" value={date} onChange={setDate} />
          </div>
          <Button variant="outline" size="sm" onClick={refetch} className="gap-1">
            <RefreshCw className="h-4 w-4" />
            {isRefetching ? "Refreshing…" : "Refresh"}
          </Button>
          <div className="ml-auto text-sm text-muted-foreground">
            {staff.length} staff members
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full rounded" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">No staff found.</TableCell>
                </TableRow>
              ) : (
                staff.map((emp) => {
                  const isSaving = isPending && savingId === emp.user_id;
                  const status   = getEdit(emp.user_id, "status", "present");
                  return (
                    <TableRow key={emp.user_id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {emp.user_firstname} {emp.user_lastname}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{emp.user_job_title || "—"}</TableCell>
                      <TableCell>
                        <Select
                          value={status}
                          onValueChange={(v) => setEdit(emp.user_id, "status", v)}
                        >
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs capitalize">
                                {s.replace("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          className="h-8 w-28 text-xs"
                          value={getEdit(emp.user_id, "check_in", "")}
                          onChange={(e) => setEdit(emp.user_id, "check_in", e.target.value)}
                          disabled={status === "absent"}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          className="h-8 w-28 text-xs"
                          value={getEdit(emp.user_id, "check_out", "")}
                          onChange={(e) => setEdit(emp.user_id, "check_out", e.target.value)}
                          disabled={status === "absent"}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 text-xs"
                          placeholder="Optional note"
                          value={getEdit(emp.user_id, "notes", "")}
                          onChange={(e) => setEdit(emp.user_id, "notes", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => handleSave(emp)}
                          disabled={isSaving}
                          className="h-8"
                        >
                          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary badges */}
        {records.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => {
              const count = records.filter((r) => r.status === s).length;
              if (!count) return null;
              return (
                <Badge key={s} variant={statusVariant[s]} className="capitalize gap-1">
                  {s.replace("_", " ")}: {count}
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
