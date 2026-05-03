/* eslint-disable react/prop-types */
import { Button } from "@/components/ui/button";
import Datatable from "@/Pages/Components/Datatable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useRef, useState } from "react";
import LoanSingleScheduleRepayment from "../Forms/LoanSingleScheduleRepayment";
import LoanAdjustmentDialog from "../Forms/LoanAdjustmentDialog";
import LoanGeneralAdjustmentDialog from "../Forms/LoanGeneralAdjustmentDialog";
import LoanRolloverDialog from "../Forms/LoanRolloverDialog";
import LoanRescheduleDialog from "../Forms/LoanRescheduleDialog";
import LoanSingleRepayment from "../Forms/LoanSingleRepayment";
import {
  formatDateTimestamp,
  hasPermission,
  prepareDataForExport,
} from "@/lib/utils";
import fileDownload from "js-file-download";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import useAuth from "@/MiddleWares/Hooks/useAuth";

const scheduleStatusBadge = (status) => {
  const s = (status || "").toLowerCase();
  const cls = {
    paid:     "bg-green-100 text-green-800 border-green-300 hover:bg-green-100",
    partial:  "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100",
    overdue:  "bg-red-100 text-red-700 border-red-300 hover:bg-red-100",
    unpaid:   "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-100",
    future:   "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50",
    active:   "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100",
    inactive: "bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-100",
  }[s] || "";
  return <Badge variant="outline" className={`capitalize text-xs font-medium ${cls}`}>{status}</Badge>;
};

export function LoanScheduleTable({
  data,
  refetch,
  isLoading,
  isRefetching,
  isError,
  loanStatus,
  loansData,
  totals,
}) {
  const axiosPrivate = useAxiosPrivate();
  const {
    auth: { roles },
  } = useAuth();

  // number helpers to avoid NaN on null/empty
  const n = (v) => Number(v ?? 0);
  const fmt = (v) => n(v).toLocaleString();
  // optional: tame floating point drift
  const round2 = (x) => Math.round((n(x) + Number.EPSILON) * 100) / 100;

  const processedData =
    data?.map((loan) => {
      const p = n(loan.loan_schedule_principal);
      const i = n(loan.loan_schedule_interest);
      const pe = n(loan.loan_schedule_penalties);
      // ✅ use the correct field name
      const m = n(loan.loan_schedule_monitoring_amount);

      const pp = n(loan.loan_schedule_principal_paid);
      const ip = n(loan.loan_schedule_interest_paid);
      const pep = n(loan.loan_schedule_penalty_paid);
      const mp = n(loan.loan_schedule_monitoring_paid);

      const totalDue = round2(p + i + pe + m);
      const totalPaid = round2(pp + ip + pep + mp);

      // Optional: never show tiny negative due to rounding
      const balance = Math.max(0, round2(totalDue - totalPaid));

      return {
        ...loan,
        amount_paid: totalPaid,
        balance,
      };
    }) ?? [];

  const tableRef = useRef(null);

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
      accessorKey: "loan_schedule_period",
      header: "Period",
      cell: ({ row }) => (
        <p className="text-xs">{row.original.loan_schedule_period}</p>
      ),
    },
    {
      accessorKey: "loan_schedule_date",
      header: "Date",
      cell: ({ row }) => (
        <p className="text-xs">
          {formatDateTimestamp(row.original.loan_schedule_date)}
        </p>
      ),
    },
    {
      accessorKey: "loan_schedule_principal",
      header: "Principal",
      cell: ({ row }) => (
        <p className="text-xs">{fmt(row.original.loan_schedule_principal)}</p>
      ),
    },
    {
      accessorKey: "loan_schedule_principal_paid",
      header: "Principal Paid",
      cell: ({ row }) => (
        <p className="text-xs">
          {fmt(row.original.loan_schedule_principal_paid)}
        </p>
      ),
    },
    {
      accessorKey: "loan_schedule_interest",
      header: "Interest",
      cell: ({ row }) => (
        <p className="text-xs">{fmt(row.original.loan_schedule_interest)}</p>
      ),
    },
    {
      accessorKey: "loan_schedule_interest_paid",
      header: "Interest Paid",
      cell: ({ row }) => (
        <p className="text-xs">
          {fmt(row.original.loan_schedule_interest_paid)}
        </p>
      ),
    },

    // ✅ Monitoring columns
    {
      accessorKey: "loan_schedule_monitoring_amount",
      header: "Monitoring Fees",
      cell: ({ row }) => (
        <p className="text-xs">
          {fmt(row.original.loan_schedule_monitoring_amount)}
        </p>
      ),
    },
    {
      accessorKey: "loan_schedule_monitoring_paid",
      header: "Monitoring Fees Paid",
      cell: ({ row }) => (
        <p className="text-xs">
          {fmt(row.original.loan_schedule_monitoring_paid)}
        </p>
      ),
    },
    {
      accessorKey: "loan_schedule_penalties",
      header: "Penalties",
      cell: ({ row }) => (
        <p className="text-xs">{fmt(row.original.loan_schedule_penalties)}</p>
      ),
    },
    {
      accessorKey: "loan_schedule_penalty_paid",
      header: "Penalties Paid",
      cell: ({ row }) => (
        <p className="text-xs">
          {fmt(row.original.loan_schedule_penalty_paid)}
        </p>
      ),
    },

    {
      accessorKey: "loan_schedule_payment_status",
      header: "Payment Status",
      cell: ({ row }) => scheduleStatusBadge(row.original.loan_schedule_payment_status),
    },
    {
      accessorKey: "loan_schedule_activity_status",
      header: "Activity Status",
      cell: ({ row }) => scheduleStatusBadge(row.original.loan_schedule_activity_status),
    },
    {
      id: "amount_paid",
      header: "Amount Paid",
      cell: ({ row }) => (
        <p className="text-xs">{fmt(row.original.amount_paid)}</p>
      ),
    },
    {
      id: "balance",
      header: "Balance",
      cell: ({ row }) => (
        <p className={`text-xs tabular-nums font-medium ${row.original.balance > 0 ? "text-red-600" : "text-green-700"}`}>
          {fmt(row.original.balance)}
        </p>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              ...
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {hasPermission(roles, 100083) && (
              <DropdownMenuItem
                onClick={() => handleOpenPayModal(row.original)}
              >
                Pay Schedule
              </DropdownMenuItem>
            )}
            {hasPermission(roles, 100084) && (
              <DropdownMenuItem
                onClick={() => handleOpenDialog("penalty", row.original)}
              >
                Adjust Penalty
              </DropdownMenuItem>
            )}
            {hasPermission(roles, 100085) && (
              <DropdownMenuItem
                onClick={() => handleOpenDialog("interest", row.original)}
              >
                Adjust Interest
              </DropdownMenuItem>
            )}
            {hasPermission(roles, 100085) && (
              <DropdownMenuItem
                onClick={() => handleOpenDialog("monitoring", row.original)}
              >
                Adjust Monitoring Fees
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const [showPayModal, setShowPayModal] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const handleOpenPayModal = (rowData) => {
    setShowPayModal(true);
    setSchedule(rowData);
  };
  const handleClosePayModal = () => {
    setShowPayModal(false);
    setSchedule([]);
  };

  const [showDialog, setShowDialog] = useState(false);
  const [action, setAction] = useState("");

  const handleOpenDialog = (act, rowData) => {
    setShowDialog(true);
    setAction(act);
    setSchedule(rowData);
  };
  const handleCloseDialog = () => {
    setShowDialog(false);
    setAction("");
    setSchedule("");
  };

  const [showGeneralDialog, setShowGeneralDialog] = useState(false);
  const handleGeneralOpenDialog = (act) => {
    setShowGeneralDialog(true);
    setAction(act);
  };
  const handleGeneralCloseDialog = () => {
    setShowGeneralDialog(false);
    setAction("");
  };

  const [showRolloverDialog, setShowRolloverDialog] = useState(false);
  const handleRolloverOpenDialog = () => setShowRolloverDialog(true);
  const handleRolloverCloseDialog = () => setShowRolloverDialog(false);

  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const handleRescheduleOpenDialog = () => setShowRescheduleDialog(true);
  const handleRescheduleCloseDialog = () => setShowRescheduleDialog(false);

  const [showRepaymentDialog, setShowRepaymentDialog] = useState(false);
  const handleRepaymentOpenDialog = () => setShowRepaymentDialog(true);
  const handleRepaymentCloseDialog = () => setShowRepaymentDialog(false);

  const [isDownloading, setIsDownloading] = useState(false);

  const onDownload = async () => {
    const controller = new AbortController();
    try {
      setIsDownloading(true);
      const exportData = prepareDataForExport(tableRef.current, processedData);
      const payload = {
        data: exportData,
        loans: loansData,
        title: "Loan Amortization Schedule",
        totals,
        colspan: 2,
        mode: { format: "A4-L", orientation: "L" },
      };
      const response = await axiosPrivate.post(
        `/export/loan-schedule/pdf`,
        { data: payload },
        { responseType: "blob", signal: controller.signal }
      );
      const unix = Math.round(+new Date() / 1000);
      const filename = `${unix}-loan-schedule.pdf`;
      fileDownload(response.data, filename);
      setIsDownloading(false);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage,
      });
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 border p-6 rounded-lg shadow-sm">
        {loanStatus === "disbursed" && (
          <>
            {hasPermission(roles, 100077) && (
              <Button size="sm" onClick={handleRepaymentOpenDialog}>
                Pay Loan
              </Button>
            )}
            {hasPermission(roles, 100078) && (
              <Button size="sm" onClick={handleRescheduleOpenDialog}>
                Reschedule
              </Button>
            )}
            {hasPermission(roles, 100079) && (
              <Button size="sm" onClick={handleRolloverOpenDialog}>
                Rollover
              </Button>
            )}
            {hasPermission(roles, 100080) && (
              <Button
                size="sm"
                onClick={() => handleGeneralOpenDialog("penalty")}
              >
                Adjust Penalty
              </Button>
            )}
            {hasPermission(roles, 100080) && (
              <Button
                size="sm"
                onClick={() => handleGeneralOpenDialog("monitoring")}
              >
                Adjust Monitoring Fees
              </Button>
            )}
            {hasPermission(roles, 100081) && (
              <Button
                size="sm"
                onClick={() => handleGeneralOpenDialog("interest")}
              >
                Adjust Interest
              </Button>
            )}
            {hasPermission(roles, 100082) && (
              <Button size="sm" onClick={onDownload} disabled={isDownloading}>
                Download Schedule
              </Button>
            )}
          </>
        )}
      </div>

      <Datatable
        ref={tableRef}
        columns={columns}
        data={processedData}
        fetchData={refetch}
        isLoading={isLoading}
        isRefetching={isRefetching}
        isError={isError}
      />

      {hasPermission(roles, 100083) && showPayModal && (
        <LoanSingleScheduleRepayment
          isOpen={showPayModal}
          onClose={handleClosePayModal}
          refetch={refetch}
          scheduleData={schedule}
        />
      )}

      {hasPermission(roles, 100077) && showRepaymentDialog && (
        <LoanSingleRepayment
          isOpen={showRepaymentDialog}
          onClose={handleRepaymentCloseDialog}
          refetch={refetch}
          isGroupLoan={loansData?.client?.client_type === "group"}
        />
      )}

      {hasPermission(roles, [100084, 100085]) && showDialog && (
        <LoanAdjustmentDialog
          refetch={refetch}
          isOpen={showDialog}
          onClose={handleCloseDialog}
          actionType={action}
          scheduleData={schedule}
        />
      )}

      {hasPermission(roles, [100080, 100081]) && showGeneralDialog && (
        <LoanGeneralAdjustmentDialog
          refetch={refetch}
          isOpen={showGeneralDialog}
          onClose={handleGeneralCloseDialog}
          actionType={action}
        />
      )}

      {hasPermission(roles, 100079) && showRolloverDialog && (
        <LoanRolloverDialog
          refetch={refetch}
          isOpen={showRolloverDialog}
          onClose={handleRolloverCloseDialog}
        />
      )}

      {hasPermission(roles, 100078) && showRescheduleDialog && (
        <LoanRescheduleDialog
          refetch={refetch}
          isOpen={showRescheduleDialog}
          onClose={handleRescheduleCloseDialog}
        />
      )}
    </>
  );
}
