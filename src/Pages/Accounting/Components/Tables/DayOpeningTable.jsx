/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Datatable from "@/Pages/Components/Datatable";
import OpenDayDialog from "./components/OpenDayDialog"; // <- ensure this path matches your tree

const currency = (n) => Number(n || 0).toLocaleString();
const pick = (b, k1, k2) => b?.[k1] ?? b?.[k2];

export default function OpeningDay() {
  const axiosPrivate = useAxiosPrivate();

  // Who am I? (decide UI scope lock)
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const ctrl = new AbortController();
      const r = await axiosPrivate.get("/auth/me", { signal: ctrl.signal });
      return r?.data?.data ?? r?.data ?? {};
    },
  });

  const dataPrivilege =
    me?.data_privilege || me?.user?.data_privilege || "sacco";
  const myBranchId = me?.branch_id ?? me?.user?.branch_id ?? null;
  const isBranchUser = String(dataPrivilege).toLowerCase() === "branch";

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [scope, setScope] = useState(isBranchUser ? "branch" : "branch"); // default branch, locked later if needed
  const [branchId, setBranchId] = useState(
    isBranchUser && myBranchId ? String(myBranchId) : ""
  );
  const [openDialog, setOpenDialog] = useState(false);

  // Branch list
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const controller = new AbortController();
      const res = await axiosPrivate.get("/settings/branches", {
        signal: controller.signal,
      });
      return res?.data?.data?.branches ?? [];
    },
  });

  // If branch-scoped and branchId not set yet, set it as soon as me loads
  if (isBranchUser && myBranchId && branchId !== String(myBranchId)) {
    setBranchId(String(myBranchId));
  }
  if (isBranchUser && scope !== "branch") {
    setScope("branch");
  }

  // Fetch snapshot
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["opening-day", date, scope, branchId],
    queryFn: async () => {
      const controller = new AbortController();
      const params = new URLSearchParams();
      params.set("date", date);
      if (isBranchUser || scope === "branch") {
        if (branchId) params.set("branch_id", branchId);
      }
      const res = await axiosPrivate.get(
        `/accounting/open-business-days?${params.toString()}`,
        { signal: controller.signal }
      );
      return res?.data?.data ?? { business_day: null, rows: [], summary: {} };
    },
    keepPreviousData: true,
    enabled: !!date && (!isBranchUser || !!branchId), // wait for branch if needed
  });

  const rows = data?.rows ?? [];
  const summary = data?.summary ?? {};
  const businessDay = data?.business_day;

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
                Teller: {m?.staff?.code} {m?.staff?.name}{" "}
                {m?.legacy ? "" : ""}
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
          <div className="flex items-center justify-between">
            <h5 className="text-2xl font-bold tracking-tight">Opening Day</h5>
            <div className="flex gap-2">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-[160px]"
              />

              <Select
                value={isBranchUser ? "branch" : scope}
                onValueChange={(v) => {
                  if (!isBranchUser) setScope(v);
                }}
                disabled={isBranchUser}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="branch">Branch</SelectItem>
                  {!isBranchUser && (
                    <SelectItem value="sacco">Whole Business</SelectItem>
                  )}
                </SelectContent>
              </Select>

              {(isBranchUser || scope === "branch") && (
                <Select
                  value={branchId}
                  onValueChange={setBranchId}
                  disabled={isBranchUser}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem
                        key={pick(b, "id", "branch_id")}
                        value={String(pick(b, "id", "branch_id"))}
                      >
                        {pick(b, "name", "branch_name")}
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
                disabled={!!businessDay}
              >
                {businessDay ? "Already Opened" : "Open Day"}
              </Button>
            </div>
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
          defaultScope={isBranchUser ? "branch" : scope}
          defaultBranchId={isBranchUser ? myBranchId : branchId}
          onSuccess={() => {
            setOpenDialog(false);
            refetch();
          }}
        />
      )}
    </>
  );
}
