/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useAuth from "@/MiddleWares/Hooks/useAuth";

import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Datatable from "@/Pages/Components/Datatable";
import OpenDayDialog from "./Components/Forms/OpenDayDialog";
import { DateField } from "@/components/DateField";

const currency = (n) => Number(n || 0).toLocaleString();
const pick = (b, k1, k2) => b?.[k1] ?? b?.[k2];

export default function OpeningDay() {
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();
  const topRef = useRef(null);

  // session → privileges
  const user = auth?.user ?? {};
  const dataPrivilege = String(user?.data_privilege || "branch").toLowerCase();
  const isSaccoUser = dataPrivilege === "sacco"; // only these see "Whole Business"
  const isBranchUser = !isSaccoUser;
  const myBranchId = auth?.current_branch_id ?? user?.branch_id ?? null;
  const allowedBranches = Array.isArray(auth?.allowed_branches)
    ? auth.allowed_branches
    : [];

  // local state
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [scope, setScope] = useState(isSaccoUser ? "business" : "branch");
  const [branchId, setBranchId] = useState(
    isBranchUser && myBranchId ? String(myBranchId) : ""
  );
  const [openDialog, setOpenDialog] = useState(false);

  // branches
  const { data: fetchedBranches = [], isFetching: isFetchingBranches } =
    useQuery({
      queryKey: ["branches"],
      queryFn: async () => {
        const controller = new AbortController();
        const res = await axiosPrivate.get("/settings/branches", {
          signal: controller.signal,
        });
        return res?.data?.data?.branches ?? [];
      },
      enabled: allowedBranches.length === 0,
    });

  const branches = useMemo(() => {
    const norm = (b) => ({
      branch_id: pick(b, "branch_id", "id"),
      branch_name: pick(b, "branch_name", "name"),
    });
    const base =
      allowedBranches.length > 0 ? allowedBranches : fetchedBranches || [];
    return base.map(norm);
  }, [allowedBranches, fetchedBranches]);

  // lock non-sacco users to branch + their branch
  useEffect(() => {
    if (!isSaccoUser) {
      if (scope !== "branch") setScope("branch");
      if (myBranchId) setBranchId(String(myBranchId));
    }
  }, [isSaccoUser, myBranchId, scope]);

  // GET preview/open snapshot for current filters
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["opening-day", date, scope, branchId, isSaccoUser],
    queryFn: async () => {
      const controller = new AbortController();
      const params = new URLSearchParams();
      params.set("date", date);

      if (!isSaccoUser || scope === "branch") {
        if (branchId) params.set("branch_id", branchId);
      }

      const res = await axiosPrivate.get(
        `/accounting/open-business-days?${params.toString()}`,
        {
          signal: controller.signal,
        }
      );
      return res?.data?.data ?? { business_day: null, rows: [], summary: {} };
    },
    keepPreviousData: true,
    enabled: !!date && (isSaccoUser || (!!branchId && scope === "branch")),
  });

  const rows = data?.rows ?? [];
  const summary = data?.summary ?? {};
  const businessDay = data?.business_day;

  // list existing open snapshots
  const {
    data: openSnapshotsRaw,
    isFetching: isFetchingList,
    refetch: refetchList,
  } = useQuery({
    queryKey: ["business-days-open", scope, branchId, isSaccoUser],
    queryFn: async () => {
      const ctrl = new AbortController();
      const params = new URLSearchParams();
      params.set("status", "open");

      if (!isSaccoUser || scope === "branch") {
        if (branchId) params.set("branch_id", branchId);
      }

      const r = await axiosPrivate.get(
        `/accounting/business-days?${params.toString()}`,
        {
          signal: ctrl.signal,
        }
      );
      const d = r?.data?.data;
      if (Array.isArray(d)) return d;
      if (d?.items && Array.isArray(d.items)) return d.items;
      if (d?.business_days && Array.isArray(d.business_days))
        return d.business_days;
      return [];
    },
    keepPreviousData: true,
    enabled: isSaccoUser ? true : !!branchId,
  });

  const openSnapshots = Array.isArray(openSnapshotsRaw) ? openSnapshotsRaw : [];

  const columns = useMemo(
    () => [
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <span className="capitalize">
            {(row.original.type || "").replace("_", " ")}
          </span>
        ),
      },
      { accessorKey: "account_title", header: "Account" },
      {
        accessorKey: "opening_balance",
        header: "Opening Balance",
        cell: ({ row }) => (
          <span className="font-medium">
            {currency(row.original.opening_balance)}
          </span>
        ),
      },
      {
        accessorKey: "meta_json",
        header: "Notes",
        cell: ({ row }) => {
          const m = row.original.meta_json || {};
          if (row.original.type === "till") {
            return (
              <span>
                Teller: {m?.staff?.code} {m?.staff?.name}
                {m?.legacy ? " " : ""}
              </span>
            );
          }
          if (["bank", "safe", "mobile_money"].includes(row.original.type)) {
            return (
              <span>
                {m?.provider_name}{" "}
                {m?.provider_reference ? `(${m.provider_reference})` : ""}
              </span>
            );
          }
          return "—";
        },
      },
    ],
    []
  );

  const loadSnapshot = (s) => {
    setDate(s.business_date);
    if (s.scope === "business" && isSaccoUser) {
      setScope("business");
      setBranchId("");
    } else {
      setScope("branch");
      if (s.branch_id) setBranchId(String(s.branch_id));
    }
    Promise.all([refetch(), refetchList()]).then(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  return (
    <>
      <div ref={topRef} />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Opening Day</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <h5 className="text-2xl font-bold tracking-tight">Opening Day</h5>
            <div className="flex gap-2">
              <DateField value={date} onChange={setDate} />

              {/* Scope selector — only for sacco users */}
              {isSaccoUser && (
                <Select
                  value={scope}
                  onValueChange={(v) => {
                    setScope(v);
                    if (v === "business") setBranchId("");
                  }}
                >
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branch">Branch</SelectItem>
                    <SelectItem value="business">Whole Business</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Branch selector when effective scope is branch */}
              {(!isSaccoUser || scope === "branch") && (
                <Select
                  value={String(branchId || "")}
                  onValueChange={setBranchId}
                  disabled={!isSaccoUser && !!myBranchId}
                >
                  <SelectTrigger className="w-[240px]">
                    <SelectValue
                      placeholder={
                        isFetchingBranches ? "Loading…" : "Select Branch"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem
                        key={String(b.branch_id)}
                        value={String(b.branch_id)}
                      >
                        {b.branch_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                Refresh
              </Button>
              <Button
                onClick={() => setOpenDialog(true)}
                disabled={!!businessDay || (!isSaccoUser && !branchId)}
              >
                {businessDay ? "Already Opened" : "Open Day"}
              </Button>
            </div>
          </div>

          {/* Open snapshots helper list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h6 className="text-base font-semibold">Open Snapshots</h6>
              <Button
                variant="outline"
                onClick={() => refetchList()}
                disabled={isFetchingList}
              >
                Refresh List
              </Button>
            </div>

            {!openSnapshots.length ? (
              <p className="text-sm text-muted-foreground">
                No open snapshots found
                {!isSaccoUser || scope === "branch" ? " for this branch." : "."}
              </p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2">Date</th>
                      <th className="text-left px-3 py-2">Scope</th>
                      <th className="text-left px-3 py-2">Branch</th>
                      <th className="text-left px-3 py-2">Opened At</th>
                      <th className="text-left px-3 py-2">Opened By</th>
                      <th className="text-left px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openSnapshots.map((s) => (
                      <tr key={s.opening_id} className="border-t">
                        <td className="px-3 py-2 font-medium">
                          {s.business_date}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="secondary">
                            {s.scope === "business"
                              ? "Whole Business"
                              : "Branch"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          {s.scope === "business"
                            ? "—"
                            : s.branch_name || s.branch_id}
                        </td>
                        <td className="px-3 py-2">{s.opened_at}</td>
                        <td className="px-3 py-2">{s.opened_by_name || "—"}</td>
                        <td className="px-3 py-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadSnapshot(s)}
                          >
                            Load Snapshot
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            {businessDay ? (
              <p className="text-sm text-emerald-700">
                Opened on <b>{businessDay.opened_at}</b> for{" "}
                <b>{businessDay.business_date}</b>.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No opening found for this date/scope.
              </p>
            )}
          </div>

          {/* Summary cards */}
          <div className="grid gap-3 grid-cols-1 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Tills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currency(summary.tills_total)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {summary.tills_count || 0} tills
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bank</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currency(summary.bank_total)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {summary.bank_count || 0} accounts
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Safe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currency(summary.safe_total)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {summary.safe_count || 0} safes
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mobile Money</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currency(summary.mm_total)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {summary.mm_count || 0} wallets
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Datatable
            columns={columns}
            data={rows}
            isLoading={isFetching}
            fetchData={refetch}
            buttonTitle=""
            isError={false}
          />
        </div>
      </div>

      {openDialog && (
        <OpenDayDialog
          isOpen={openDialog}
          onClose={() => setOpenDialog(false)}
          defaultDate={date}
          defaultScope={scope}
          defaultBranchId={!isSaccoUser || scope === "branch" ? branchId : ""}
          isSaccoUser={isSaccoUser}
          onSuccess={() => {
            setOpenDialog(false);
            refetch();
            refetchList();
          }}
        />
      )}
    </>
  );
}
