import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useMemo, useRef, useState } from "react";
import TillReportQuery from "../Queries/TillReportQuery";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { Badge } from "@/components/ui/badge"; // fallback below if you don't have this

const TillSheet = () => {
  const axiosPrivate = useAxiosPrivate();
  const tableRef = useRef(null);
  const { auth } = useAuth();

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    till_id: "",
  });

  const {
    data = {},
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["general-till-sheet", filters],
    queryFn: async () => {
      const controller = new AbortController();
      const res = await axiosPrivate.get(`/reports/accounting/till-sheet`, {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          till_id: filters.till_id,
        },
        signal: controller.signal,
      });
      return res?.data?.data ?? {};
    },
    keepPreviousData: true,
  });

  // --- highlight helpers (client-side only) ---
  const classifyRow = (r) => {
    const d = (r?.description || "").toString().toLowerCase();
    if (d.startsWith("opening balance")) return "opening";
    if (d.startsWith("closing balance")) return "closing";
    return "normal";
  };

  const rowAccent = (type) => {
    switch (type) {
      case "opening":
        return "bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border-l-4 border-amber-400 dark:border-amber-300 font-semibold";
      case "closing":
        return "bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border-l-4 border-blue-400 dark:border-blue-300 font-semibold";
      default:
        return "";
    }
  };

  const cashRows = useMemo(() => {
    const rows = data?.cash || [];
    return rows.map((r) => ({ ...r, __type: classifyRow(r) }));
  }, [data]);

  const totals = data?.totals || { cash_in: 0, cash_out: 0 };

  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <div className={`px-2 py-1 rounded ${rowAccent(row.original.__type)}`}>
          <p>{formatDateTimestamp(row.original.date)}</p>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const t = row.original.__type;
        const isOpening = t === "opening";
        const isClosing = t === "closing";
        return (
          <div
            className={`px-2 py-1 rounded flex items-center gap-2 ${rowAccent(
              t
            )}`}
          >
            {isOpening || isClosing ? (
              <Badge
                variant="secondary"
                className={
                  isOpening
                    ? "bg-amber-200 text-amber-900 dark:bg-amber-700 dark:text-amber-100"
                    : "bg-blue-200 text-blue-900 dark:bg-blue-700 dark:text-blue-100"
                }
              >
                {isOpening ? "Opening" : "Closing"}
              </Badge>
            ) : null}
            <p className="capitalize text-xs">{row.original.description}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "debit",
      header: "Cash In (Dr)",
      cell: ({ row }) => (
        <div className={`px-2 py-1 rounded ${rowAccent(row.original.__type)}`}>
          <p className="text-xs">
            {row.original.debit !== ""
              ? Number(row.original.debit).toLocaleString()
              : 0}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "credit",
      header: "Cash Out (Cr)",
      cell: ({ row }) => (
        <div className={`px-2 py-1 rounded ${rowAccent(row.original.__type)}`}>
          <p className="text-xs">
            {row.original.credit !== ""
              ? Number(row.original.credit).toLocaleString()
              : 0}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "balance",
      header: "Running Balance",
      cell: ({ row }) => (
        <div className={`px-2 py-1 rounded ${rowAccent(row.original.__type)}`}>
          <p className="text-xs">
            {row.original.balance !== ""
              ? Number(row.original.balance).toLocaleString()
              : 0}
          </p>
        </div>
      ),
    },
  ];

  const handleFilterChange = (payload) => {
    setFilters(payload);
    refetch();
  };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/accounting-reports">
              Accounting Reports
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Till Sheet</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">Till Sheet</h5>
          </div>

          <TillReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={cashRows}
            tableRef={tableRef}
            filters={filters}
            colSpan={2}
            mode={{ format: "A4-P", orientation: "P" }}
            totals={{ debit: totals.cash_in, credit: totals.cash_out }}
            title={`Till Sheet - ${auth?.user?.firstname} ${auth?.user?.lastname}`}
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
      </div>
    </>
  );
};

export default TillSheet;
