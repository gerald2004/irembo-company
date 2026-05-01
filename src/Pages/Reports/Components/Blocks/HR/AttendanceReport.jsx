import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { RefreshCw, RotateCcw } from "lucide-react";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { useBranches } from "@/Queries/Settings/branches";
import { useUsers } from "@/Queries/Settings/users";

const statusBadge = (status) => {
  const map = {
    present:  "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    absent:   "bg-red-100    text-red-700    border-red-300    dark:bg-red-900/30    dark:text-red-400    dark:border-red-800",
    late:     "bg-amber-100  text-amber-800  border-amber-300  dark:bg-amber-900/30  dark:text-amber-400  dark:border-amber-800",
    half_day: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
    on_leave: "bg-blue-100   text-blue-800   border-blue-300   dark:bg-blue-900/30   dark:text-blue-400   dark:border-blue-800",
  };
  return (
    <Badge variant="outline" className={`capitalize text-xs ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status?.replace("_", " ") ?? "—"}
    </Badge>
  );
};

const AttendanceReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const tableRef = useRef(null);
  const summaryRef = useRef(null);

  const isSacco = auth?.user?.data_privilege === "sacco";
  const isBranch = auth?.user?.data_privilege === "branch";
  const fiscalStart = auth?.fiscalYear?.start_date
    ? new Date(auth.fiscalYear.start_date)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [dateRange, setDateRange] = useState({ from: fiscalStart, to: new Date() });
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedUser,   setSelectedUser]   = useState("all");
  const [filters, setFilters] = useState({
    startDate: fiscalStart.toLocaleDateString("en-CA"),
    endDate: new Date().toLocaleDateString("en-CA"),
    branch_id: "",
    user_id: "",
  });

  const { data: branches = [] } = useBranches();
  const { data: users = [] } = useUsers();

  const filteredUsers = isSacco
    ? users.filter((u) => selectedBranch === "all" || String(u.branch_id) === String(selectedBranch))
    : users.filter((u) => String(u.branch_id) === String(auth?.user?.branch_id));

  const { data: reportData, isLoading, isRefetching, isError, refetch } = useQuery({
    queryKey: ["attendance-report", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/hr/attendance", {
          params: {
            startDate: filters.startDate,
            endDate:   filters.endDate,
            branch_id: filters.branch_id,
            user_id:   filters.user_id,
          },
        });
        return res?.data?.data ?? { records: [], summary: [] };
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        return { records: [], summary: [] };
      }
    },
    placeholderData: (prev) => prev,
  });

  const records = reportData?.records ?? [];
  const summary = reportData?.summary ?? [];

  const toParam = (v) => (v === "all" ? "" : v);

  const handleApply = () => {
    setFilters({
      startDate: dateRange.from.toLocaleDateString("en-CA"),
      endDate:   dateRange.to.toLocaleDateString("en-CA"),
      branch_id: toParam(selectedBranch),
      user_id:   toParam(selectedUser),
    });
  };

  const handleReset = () => {
    setDateRange({ from: fiscalStart, to: new Date() });
    setSelectedBranch("all");
    setSelectedUser("all");
    setFilters({
      startDate: fiscalStart.toLocaleDateString("en-CA"),
      endDate:   new Date().toLocaleDateString("en-CA"),
      branch_id: "",
      user_id:   "",
    });
  };

  const recordColumns = [
    {
      accessorKey: "attendance_date",
      header: "Date",
      cell: ({ row }) => <p className="text-xs font-mono">{row.original.attendance_date}</p>,
    },
    {
      accessorKey: "officer_code",
      header: "Code",
      cell: ({ row }) => <p className="text-xs font-mono">{row.original.officer_code}</p>,
    },
    {
      accessorKey: "officer_name",
      header: "Staff Name",
      cell: ({ row }) => <p className="text-xs font-medium capitalize">{row.original.officer_name}</p>,
    },
    {
      accessorKey: "check_in",
      header: "Check In",
      cell: ({ row }) => <p className="text-xs">{row.original.check_in ?? "—"}</p>,
    },
    {
      accessorKey: "check_out",
      header: "Check Out",
      cell: ({ row }) => <p className="text-xs">{row.original.check_out ?? "—"}</p>,
    },
    {
      accessorKey: "hours_worked",
      header: "Hours",
      cell: ({ row }) => (
        <p className="text-xs">
          {row.original.hours_worked != null ? `${row.original.hours_worked}h` : "—"}
        </p>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => statusBadge(row.original.status),
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => (
        <p className="text-xs text-muted-foreground max-w-[180px] truncate">
          {row.original.notes || "—"}
        </p>
      ),
    },
  ];

  const summaryColumns = [
    {
      accessorKey: "officer_code",
      header: "Code",
      cell: ({ row }) => <p className="text-xs font-mono">{row.original.officer_code}</p>,
    },
    {
      accessorKey: "officer_name",
      header: "Staff Name",
      cell: ({ row }) => <p className="text-xs font-medium capitalize">{row.original.officer_name}</p>,
    },
    {
      accessorKey: "total_days",
      header: "Total Days",
      cell: ({ row }) => <p className="text-xs text-center">{row.original.total_days}</p>,
    },
    {
      accessorKey: "present",
      header: "Present",
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
          {row.original.present}
        </Badge>
      ),
    },
    {
      accessorKey: "absent",
      header: "Absent",
      cell: ({ row }) => (
        <Badge variant="outline" className={`text-xs ${row.original.absent > 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-500"}`}>
          {row.original.absent}
        </Badge>
      ),
    },
    {
      accessorKey: "late",
      header: "Late",
      cell: ({ row }) => (
        <Badge variant="outline" className={`text-xs ${row.original.late > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-500"}`}>
          {row.original.late}
        </Badge>
      ),
    },
    {
      accessorKey: "half_day",
      header: "Half Day",
      cell: ({ row }) => <p className="text-xs text-center">{row.original.half_day}</p>,
    },
    {
      accessorKey: "on_leave",
      header: "On Leave",
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
          {row.original.on_leave}
        </Badge>
      ),
    },
    {
      accessorKey: "total_hours",
      header: "Total Hours",
      cell: ({ row }) => (
        <p className="text-xs font-medium">{parseFloat(row.original.total_hours ?? 0).toFixed(1)}h</p>
      ),
    },
  ];

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/hr-reports">HR Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Attendance Report</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <h5 className="text-2xl font-bold tracking-tight">Staff Attendance Report</h5>

          {/* Filter bar */}
          <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Date Range</Label>
              <CalendarDateRangePicker
                defaultValue={dateRange}
                onChange={(r) => r?.from && r?.to && setDateRange({ from: new Date(r.from), to: new Date(r.to) })}
              />
            </div>

            {isSacco && (
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Branch</Label>
                <Select value={selectedBranch} onValueChange={(v) => { setSelectedBranch(v); setSelectedUser(""); }}>
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(isSacco || isBranch) && (
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Staff Member</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="h-8 w-44 text-xs">
                    <SelectValue placeholder="All Staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {filteredUsers.map((u) => (
                      <SelectItem key={u.user_id} value={String(u.user_id)}>
                        {u.user_firstname} {u.user_lastname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end gap-2">
              <Button size="sm" className="h-8" onClick={handleApply} disabled={isRefetching}>
                {isRefetching ? <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
                {isRefetching ? "Loading…" : "Apply"}
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={handleReset}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
              </Button>
            </div>
          </div>

          <Tabs defaultValue="summary" className="space-y-4">
            <TabsList>
              <TabsTrigger value="summary">Summary by Staff</TabsTrigger>
              <TabsTrigger value="records">Daily Records</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              <DatatableReport
                ref={summaryRef}
                columns={summaryColumns}
                data={summary}
                fetchData={refetch}
                isLoading={isLoading}
                isRefetching={isRefetching}
                isError={isError}
                colSpan={9}
              />
            </TabsContent>

            <TabsContent value="records" className="space-y-4">
              <DatatableReport
                ref={tableRef}
                columns={recordColumns}
                data={records}
                fetchData={refetch}
                isLoading={isLoading}
                isRefetching={isRefetching}
                isError={isError}
                colSpan={8}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AttendanceReport;
