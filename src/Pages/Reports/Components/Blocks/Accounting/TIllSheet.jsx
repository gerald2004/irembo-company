import { useMemo, useRef, useState } from "react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import DatatableReport from "@/Pages/Components/DatatableReport";
import ReportFilterBar from "../Queries/ReportFilterBar";
import { formatDateTimestamp } from "@/lib/utils";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { useTills } from "@/Queries/Settings/tills";

const TillSheet = () => {
  const axiosPrivate = useAxiosPrivate();
  const tableRef = useRef(null);
  const { auth } = useAuth();
  const { data: tills = [] } = useTills();

  const [selectedTill, setSelectedTill] = useState("");
  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({
    startDate: "", endDate: "", branch_id: String(branchKey ?? ""), status: "all",
  });

  const { data = {}, isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["general-till-sheet", filters, selectedTill],
    queryFn: async ({ signal }) => {
      const res = await axiosPrivate.get("/reports/accounting/till-sheet", {
        params: { startDate: filters.startDate, endDate: filters.endDate, till_id: selectedTill },
        signal,
      });
      return res?.data?.data ?? {};
    },
    placeholderData: (prev) => prev,
  });

  const classifyRow = (r) => {
    const d = (r?.description || "").toLowerCase();
    if (d.startsWith("opening balance")) return "opening";
    if (d.startsWith("closing balance")) return "closing";
    return "normal";
  };

  const rowAccent = (type) => {
    if (type === "opening") return "bg-amber-50 dark:bg-amber-900/30 font-semibold border-l-4 border-amber-400";
    if (type === "closing") return "bg-blue-50 dark:bg-blue-900/30 font-semibold border-l-4 border-blue-400";
    return "";
  };

  const cashRows = useMemo(() => (data?.cash ?? []).map((r) => ({ ...r, __type: classifyRow(r) })), [data]);
  const totals = data?.totals ?? { cash_in: 0, cash_out: 0 };

  const filteredTills = useMemo(() => {
    if (auth?.user?.data_privilege === "branch") {
      return tills.filter((t) => t.staff?.branch_id === auth.user?.branch_id);
    }
    return tills;
  }, [tills, auth]);

  const columns = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <div className={`px-1 ${rowAccent(row.original.__type)}`}>
          <p className="text-xs">{formatDateTimestamp(row.original.date)}</p>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const t = row.original.__type;
        return (
          <div className={`px-1 flex items-center gap-2 ${rowAccent(t)}`}>
            {t !== "normal" && (
              <Badge variant="secondary" className={t === "opening" ? "bg-amber-200 text-amber-900" : "bg-blue-200 text-blue-900"}>
                {t === "opening" ? "Opening" : "Closing"}
              </Badge>
            )}
            <p className="text-xs">{row.original.description}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "debit",
      header: "Cash In (Dr)",
      cell: ({ row }) => (
        <p className="text-xs tabular-nums text-green-700">
          {row.original.debit ? Number(row.original.debit).toLocaleString() : "0"}
        </p>
      ),
    },
    {
      accessorKey: "credit",
      header: "Cash Out (Cr)",
      cell: ({ row }) => (
        <p className="text-xs tabular-nums text-red-600">
          {row.original.credit ? Number(row.original.credit).toLocaleString() : "0"}
        </p>
      ),
    },
    {
      accessorKey: "balance",
      header: "Running Balance",
      cell: ({ row }) => (
        <p className="text-xs tabular-nums font-medium">
          {row.original.balance ? Number(row.original.balance).toLocaleString() : "0"}
        </p>
      ),
    },
  ];

  const exportHeaders = ["Date", "Description", "Cash In", "Cash Out", "Balance"];
  const exportRows = cashRows.map((r) => [
    r.date, r.description,
    parseFloat(r.debit || 0).toFixed(2),
    parseFloat(r.credit || 0).toFixed(2),
    parseFloat(r.balance || 0).toFixed(2),
  ]);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/accounting-reports">Accounting Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Till Sheet</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-4 pt-2">
        <h5 className="text-2xl font-bold tracking-tight">Till Sheet</h5>

        <ReportFilterBar
          onApply={setFilters}
          isLoading={isRefetching}
          showStatus={false}
          extra={
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Transaction Till</Label>
              <Select value={selectedTill} onValueChange={setSelectedTill}>
                <SelectTrigger className="h-8 w-52 text-xs">
                  <SelectValue placeholder="Select till / staff" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTills.map((t) => (
                    <SelectItem key={t.till_id} value={String(t.till_id)}>
                      {t.staff.user_firstname} {t.staff.user_lastname} ({t.staff.user_identification_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
          exportTitle="Till Sheet"
          exportFilename="till-sheet"
          exportHeaders={exportHeaders}
          exportRows={exportRows}
          exportDisabled={!cashRows.length}
        />

        <DatatableReport
          ref={tableRef}
          columns={columns}
          data={cashRows}
          fetchData={refetch}
          isLoading={isLoading}
          isRefetching={isRefetching}
          isError={isError}
          colSpan={3}
          totalDebit={totals.cash_in}
          totalCredit={totals.cash_out}
        />
      </div>
    </>
  );
};

export default TillSheet;
