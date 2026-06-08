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
import InterBranchTransferDialog from "./Components/Forms/InterBranchTransferDialog";
import { DateField } from "@/components/DateField";
import { ArrowRight } from "lucide-react";

const currency = (n) => Number(n || 0).toLocaleString();

export default function InterBranchTransfers() {
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();
  const topRef = useRef(null);

  const user = auth?.user ?? {};

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [openDialog, setOpenDialog] = useState(false);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["inter-branch-transfers", date],
    queryFn: async () => {
      const ctrl = new AbortController();
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      const r = await axiosPrivate.get(
        `/accounting/inter-branch-transfers?${params.toString()}`,
        { signal: ctrl.signal }
      );
      return r?.data?.data?.transfers ?? [];
    },
    keepPreviousData: true,
  });

  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "transfer_date",
        header: "Date",
      },
      {
        accessorKey: "transaction_code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.transaction_code}</span>
        ),
      },
      {
        id: "route",
        header: "Route",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-1 text-xs">
              <div className="text-center">
                <div className="font-medium">Branch #{r.from_branch_id}</div>
                <div className="text-muted-foreground capitalize">{r.from_scope}</div>
              </div>
              <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
              <div className="text-center">
                <div className="font-medium">Branch #{r.to_branch_id}</div>
                <div className="text-muted-foreground capitalize">{r.to_scope}</div>
              </div>
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
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "posted" ? "default" : "secondary"}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "journals",
        header: "Journals",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="text-xs text-muted-foreground">
              <div>Out: #{r.je_out_id}</div>
              <div>In: #{r.je_in_id}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.reason || "—"}
          </span>
        ),
      },
    ],
    []
  );

  const totalAmount = rows.reduce((s, r) => s + Number(r.amount || 0), 0);

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
            <BreadcrumbPage>Inter-Branch Transfers</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between">
            <h5 className="text-2xl font-bold tracking-tight">
              Inter-Branch Transfers
            </h5>
            <div className="flex items-center gap-2">
              <DateField value={date} onChange={setDate} label="" className="w-[200px]" />
              <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                Refresh
              </Button>
              <Button className="text-xs" onClick={() => setOpenDialog(true)}>
                New Transfer
              </Button>
            </div>
          </div>

          <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>Count</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rows.length}</div>
                <div className="text-xs text-muted-foreground">transfers shown</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Total Amount</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currency(totalAmount)}</div>
                <div className="text-xs text-muted-foreground">for selected day</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Latest Code</CardTitle></CardHeader>
              <CardContent>
                <div className="text-xl font-bold font-mono">{rows[0]?.transaction_code || "—"}</div>
                <div className="text-xs text-muted-foreground">most recent</div>
              </CardContent>
            </Card>
          </div>

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
        <InterBranchTransferDialog
          isOpen={openDialog}
          onClose={() => setOpenDialog(false)}
          defaultDate={date}
          onSuccess={() => {
            setOpenDialog(false);
            refetch();
          }}
        />
      )}
    </>
  );
}
