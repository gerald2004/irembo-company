/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { toast } from "@/hooks/use-toast";

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
// import { Input } from "@/components/ui/input"; // ← removed
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Datatable from "@/Pages/Components/Datatable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DateField } from "@/components/DateField"; // ← shadcn popover date

const currency = (n) => Number(n || 0).toLocaleString();
const pick = (b, k1, k2) => b?.[k1] ?? b?.[k2];

export default function ClosingDay() {
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();
  const topRef = useRef(null);

  // ---- session-derived scope/branch
  const user = auth?.user ?? {};
  const dataPrivilege = String(user?.data_privilege || "sacco").toLowerCase();
  const isBranchUser = dataPrivilege === "branch";
  const myBranchId = auth?.current_branch_id ?? user?.branch_id ?? null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allowedBranches = Array.isArray(auth?.allowed_branches)
    ? auth.allowed_branches
    : [];

  // ---- local state
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [scope, setScope] = useState(isBranchUser ? "branch" : "business"); // 'branch' | 'business'
  const [branchId, setBranchId] = useState(
    isBranchUser && myBranchId ? String(myBranchId) : ""
  );
  const [confirmOpen, setConfirmOpen] = useState(false); // confirm close dialog

  // ---- branches (prefer allowed_branches; otherwise fetch)
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

  // lock branch scope for branch users
  useEffect(() => {
    if (isBranchUser) {
      setScope("branch");
      if (myBranchId) setBranchId(String(myBranchId));
    }
  }, [isBranchUser, myBranchId]);

  // ---- open snapshots list
  const {
    data: openSnapshotsRaw,
    isFetching: isFetchingOpen,
    refetch: refetchOpen,
  } = useQuery({
    queryKey: ["business-days-open", isBranchUser, branchId],
    queryFn: async () => {
      const ctrl = new AbortController();
      const params = new URLSearchParams();
      params.set("status", "open");
      if (isBranchUser && branchId) params.set("branch_id", branchId);
      const r = await axiosPrivate.get(
        `/accounting/business-days?${params.toString()}`,
        { signal: ctrl.signal }
      );
      return r?.data?.data ?? [];
    },
    keepPreviousData: true,
    enabled: !isBranchUser || !!branchId,
  });

  // normalize to array (backend may return {business_days:[...]} or just [...])
  const openSnapshots = useMemo(() => {
    if (Array.isArray(openSnapshotsRaw)) return openSnapshotsRaw;
    if (openSnapshotsRaw && Array.isArray(openSnapshotsRaw.business_days))
      return openSnapshotsRaw.business_days;
    return [];
  }, [openSnapshotsRaw]);

  // ---- preview close
  const {
    data: preview,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["close-preview", date, scope, branchId, isBranchUser],
    queryFn: async () => {
      const ctrl = new AbortController();
      const params = new URLSearchParams();
      params.set("date", date);
      if (isBranchUser || scope === "branch") {
        if (branchId) params.set("branch_id", branchId);
      }
      const res = await axiosPrivate.get(
        `/accounting/close-business-days?${params.toString()}`,
        { signal: ctrl.signal }
      );
      return res?.data?.data ?? { business_day: null, rows: [], summary: {} };
    },
    keepPreviousData: true,
    enabled: !!date && (!isBranchUser || !!branchId),
  });

  const rows = preview?.rows ?? [];
  const summary = preview?.summary ?? {};
  const opening = preview?.business_day;

  // ---- load snapshot into preview controls
  const loadSnapshot = (s, openConfirm = false) => {
    setDate(s.business_date);
    setScope(s.scope === "business" ? "business" : "branch");
    if (s.scope === "branch" && s.branch_id) setBranchId(String(s.branch_id));
    Promise.all([refetch(), refetchOpen()]).then(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth" });
      if (openConfirm) setConfirmOpen(true);
    });
  };

  // ---- close mutation
  const { mutate: doClose, isLoading: isClosing } = useMutation({
    mutationFn: async () => {
      const ctrl = new AbortController();
      const payload = {
        business_date: date,
        scope: isBranchUser || scope === "branch" ? "branch" : "business",
        ...(isBranchUser || scope === "branch"
          ? { branch_id: branchId ? parseInt(branchId) : undefined }
          : {}),
      };
      const res = await axiosPrivate.post(
        "/accounting/close-business-days",
        payload,
        { signal: ctrl.signal }
      );
      return res?.data?.data;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Business day closed." });
      setConfirmOpen(false);
      refetch();
      refetchOpen();
    },
    onError: (err) => {
      const msg = err?.response?.data?.messages || "No server response";
      toast({
        title: "Unable to close",
        variant: "destructive",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
      });
    },
  });

  // ---- table columns
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
        header: "Opening",
        cell: ({ row }) => (
          <span className="font-medium">
            {currency(row.original.opening_balance)}
          </span>
        ),
      },
      {
        accessorKey: "closing_balance",
        header: "Closing",
        cell: ({ row }) => (
          <span className="font-medium">
            {currency(row.original.closing_balance)}
          </span>
        ),
      },
      {
        accessorKey: "delta_amount",
        header: "Δ (Movement)",
        cell: ({ row }) => {
          const v = Number(row.original.delta_amount || 0);
          const cls =
            v > 0
              ? "text-emerald-700"
              : v < 0
              ? "text-red-600"
              : "text-muted-foreground";
          return <span className={`font-semibold ${cls}`}>{currency(v)}</span>;
        },
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
            <BreadcrumbPage>Close Business Day</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <h5 className="text-2xl font-bold tracking-tight">
              Close Business Day
            </h5>
            <div className="flex gap-2">
              {/* Shadcn Date popover */}
              <DateField
                label=""
                className="w-[200px]"
                value={date}
                onChange={setDate}
              />

              {/* Scope selector — disabled for branch-scoped users */}
              <Select
                value={isBranchUser ? "branch" : scope}
                onValueChange={(v) => {
                  if (!isBranchUser) setScope(v);
                }}
                disabled={isBranchUser}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="branch">Branch</SelectItem>
                  {!isBranchUser && (
                    <SelectItem value="business">Whole Business</SelectItem>
                  )}
                </SelectContent>
              </Select>

              {/* Branch selector when branch scope active */}
              {(isBranchUser || scope === "branch") && (
                <Select
                  value={branchId ? String(branchId) : ""}
                  onValueChange={setBranchId}
                  disabled={isBranchUser}
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
                Refresh Preview
              </Button>

              {/* Confirm close dialog */}
              <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Close Business Day?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This captures closing balances as of 23:59:59 on{" "}
                      <b>{date}</b> for{" "}
                      <b>
                        {isBranchUser || scope === "branch"
                          ? "Branch"
                          : "Whole Business"}
                      </b>
                      {(isBranchUser || scope === "branch") && branchId
                        ? ` (Branch #${branchId})`
                        : ""}
                      .
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isClosing}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => doClose()}
                      disabled={isClosing}
                    >
                      {isClosing ? "Closing..." : "Yes, Close Day"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={!opening || isClosing}
              >
                {opening
                  ? isClosing
                    ? "Closing..."
                    : "Close Day"
                  : "Nothing to Close"}
              </Button>
            </div>
          </div>

          {/* Open snapshots list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h6 className="text-base font-semibold">Open Snapshots</h6>
              <Button
                variant="outline"
                onClick={() => refetchOpen()}
                disabled={isFetchingOpen}
              >
                Refresh List
              </Button>
            </div>

            {!Array.isArray(openSnapshots) || openSnapshots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No open snapshots found
                {isBranchUser ? " for your branch." : "."}
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
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadSnapshot(s, false)}
                            >
                              Load & Preview
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => loadSnapshot(s, true)}
                            >
                              Close This Day
                            </Button>
                          </div>
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
            {opening ? (
              <p className="text-sm text-emerald-700">
                Closing preview for <b>{opening.business_date}</b>. Opened at{" "}
                <b>{opening.opened_at}</b>.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No open snapshot for the selected date/scope.
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
                <div className="text-sm">Opening → Closing</div>
                <div className="text-xl font-bold">
                  {currency(summary.tills_open || 0)} →{" "}
                  {currency(summary.tills_close || 0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {summary.tills_count || 0} tills, Δ{" "}
                  {currency(summary.tills_delta || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bank</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">Opening → Closing</div>
                <div className="text-xl font-bold">
                  {currency(summary.bank_open || 0)} →{" "}
                  {currency(summary.bank_close || 0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {summary.bank_count || 0} accounts, Δ{" "}
                  {currency(summary.bank_delta || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Safe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">Opening → Closing</div>
                <div className="text-xl font-bold">
                  {currency(summary.safe_open || 0)} →{" "}
                  {currency(summary.safe_close || 0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {summary.safe_count || 0} safes, Δ{" "}
                  {currency(summary.safe_delta || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mobile Money</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">Opening → Closing</div>
                <div className="text-xl font-bold">
                  {currency(summary.mm_open || 0)} →{" "}
                  {currency(summary.mm_close || 0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {summary.mm_count || 0} wallets, Δ{" "}
                  {currency(summary.mm_delta || 0)}
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
    </>
  );
}
