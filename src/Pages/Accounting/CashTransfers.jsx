/* eslint-disable react/prop-types */
import { useMemo, useRef, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import Datatable from "@/Pages/Components/Datatable";
import CashTransferDialog from "./Components/Forms/CashTransferDialog";
import { DateField } from "@/components/DateField";

const currency = (n) => Number(n || 0).toLocaleString();

export default function CashTransfers() {
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();
  const topRef = useRef(null);

  const user = auth?.user ?? {};
  const dataPrivilege = String(user?.data_privilege || "branch").toLowerCase();
  const isSaccoUser = dataPrivilege === "sacco";
  const myBranchId = auth?.current_branch_id ?? user?.branch_id ?? null;

  // Filters
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [branchId, setBranchId] = useState(
    isSaccoUser ? "" : myBranchId ? String(myBranchId) : ""
  );
  const [openDialog, setOpenDialog] = useState(false);

  // Branch list only for SACCO users (reuse your endpoint)
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const ctrl = new AbortController();
      const r = await axiosPrivate.get("/settings/branches", {
        signal: ctrl.signal,
      });
      const raw = r?.data?.data?.branches ?? [];
      return raw.map((b) => ({
        id: b.id ?? b.branch_id,
        name: b.name ?? b.branch_name,
      }));
    },
    enabled: isSaccoUser,
  });

  // List transfers (limit on backend ~200 per code)
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["cash-transfers", date, branchId, isSaccoUser],
    queryFn: async () => {
      const ctrl = new AbortController();
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (isSaccoUser && branchId) params.set("branch_id", branchId);

      const r = await axiosPrivate.get(
        `/accounting/cash-transfers?${params.toString()}`,
        { signal: ctrl.signal }
      );
      // backend returns { transfers: [...] }
      return r?.data?.data?.transfers ?? [];
    },
    keepPreviousData: true,
    enabled: !!date && (!isSaccoUser || true), // sacco optional branch
  });

  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "business_date",
        header: "Date",
        cell: ({ row }) => <span>{row.original.business_date}</span>,
      },
      {
        accessorKey: "transfer_type",
        header: "Type",
        cell: ({ row }) => {
          const txt = (row.original.transfer_type || "").replaceAll("_", " ");
          return (
            <Badge variant="secondary" className="capitalize">
              {txt}
            </Badge>
          );
        },
      },
      {
        accessorKey: "from",
        header: "From",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="text-xs">
              <div className="font-medium capitalize">{r.from_scope}</div>
              <div className="text-muted-foreground">Ref: {r.from_ref_id}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "to",
        header: "To",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="text-xs">
              <div className="font-medium capitalize">{r.to_scope}</div>
              <div className="text-muted-foreground">Ref: {r.to_ref_id}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-semibold">{currency(row.original.amount)}</span>
        ),
      },
      {
        accessorKey: "transaction_code",
        header: "Code",
      },
      {
        accessorKey: "journal_entry_id",
        header: "Journal",
        cell: ({ row }) =>
          row.original.journal_entry_id ? (
            <span>#{row.original.journal_entry_id}</span>
          ) : (
            "—"
          ),
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
            <BreadcrumbPage>Cash Transfers</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <h5 className="text-2xl font-bold tracking-tight">
              Cash Transfers
            </h5>
            <div className="flex items-center gap-2">
              <DateField
                value={date}
                onChange={setDate}
                label=""
                className="w-[200px]"
              />

              {/* Branch filter for SACCO users only (optional) */}
              {isSaccoUser && (
                <div className="flex items-center gap-2">
                  <select
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                  >
                    <option value="">All Branches</option>
                    {branches.map((b) => (
                      <option key={String(b.id)} value={String(b.id)}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                Refresh
              </Button>
              <Button className="text-xs" onClick={() => setOpenDialog(true)}>New Transfer</Button>
            </div>
          </div>

          {/* Summary Cards (quick glance) */}
          <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Count</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rows.length}</div>
                <div className="text-xs text-muted-foreground">
                  records shown
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currency(
                    rows.reduce((s, r) => s + Number(r.amount || 0), 0)
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  for selected day
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Latest Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rows[0]?.transaction_code || "—"}
                </div>
                <div className="text-xs text-muted-foreground">most recent</div>
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
        <CashTransferDialog
          isOpen={openDialog}
          onClose={() => setOpenDialog(false)}
          defaultDate={date}
          defaultBranchId={isSaccoUser ? branchId : myBranchId}
          isSaccoUser={isSaccoUser}
          onSuccess={() => {
            setOpenDialog(false);
            refetch();
          }}
        />
      )}
    </>
  );
}
