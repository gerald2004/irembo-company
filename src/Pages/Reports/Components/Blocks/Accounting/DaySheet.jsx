import { useRef, useState } from "react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import ReportFilterBar from "../Queries/ReportFilterBar";
import { formatDateTimestamp } from "@/lib/utils";

const rowColumns = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <p className="text-xs">{formatDateTimestamp(row.original.date)}</p>,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <p className="text-xs">{row.original.description}</p>,
  },
  {
    accessorKey: "account",
    header: "Account",
    cell: ({ row }) => <p className="text-xs">{row.original.account}</p>,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <p className="text-xs tabular-nums font-medium">
        {parseFloat(row.original.amount || 0).toLocaleString()}
      </p>
    ),
  },
];

const buildExport = (rows) => ({
  headers: ["Date", "Description", "Account", "Amount"],
  rows: rows.map((r) => [r.date, r.description, r.account, parseFloat(r.amount || 0).toFixed(2)]),
});

const DaySheet = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [filters, setFilters] = useState({
    startDate: "", endDate: "", branch_id: "", status: "all",
  });

  const { data = {}, isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["general-day-sheet", filters],
    queryFn: async ({ signal }) => {
      try {
        const res = await axiosPrivate.get("/reports/accounting/day-sheet", {
          params: { startDate: filters.startDate, endDate: filters.endDate, branch_id: filters.branch_id },
          signal,
        });
        return res?.data?.data ?? {};
      } catch (err) {
        if (err?.response?.status === 401) navigate("/", { replace: true });
        throw err;
      }
    },
    placeholderData: (prev) => prev,
  });

  const deposits    = data?.deposits    ?? [];
  const withdrawals = data?.withdrawals ?? [];
  const totals      = data?.totals      ?? { deposits: 0, withdrawals: 0 };

  const depositExport = buildExport(deposits);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/accounting-reports">Accounting Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Day Sheet</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-4 pt-2">
        <h5 className="text-2xl font-bold tracking-tight">Day Sheet</h5>

        <ReportFilterBar
          onApply={setFilters}
          isLoading={isRefetching}
          showStatus={false}
          exportTitle="Day Sheet — Inflows"
          exportFilename="day-sheet-inflows"
          exportHeaders={depositExport.headers}
          exportRows={depositExport.rows}
          exportDisabled={!deposits.length && !withdrawals.length}
        />

        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-base font-semibold text-green-700">Inflow (Deposits)</h4>
            <DatatableReport
              ref={tableRef}
              columns={rowColumns}
              data={deposits}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              colSpan={1}
              totalDebit={totals.deposits}
            />
          </div>

          <div className="space-y-2">
            <h4 className="text-base font-semibold text-red-600">Outflow (Withdrawals)</h4>
            <DatatableReport
              columns={rowColumns}
              data={withdrawals}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              colSpan={1}
              totalDebit={totals.withdrawals}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default DaySheet;
