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
import { useState } from "react";
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
import { useRef } from "react";
import fileDownload from "js-file-download";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import useAuth from "@/MiddleWares/Hooks/useAuth";

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
  const processedData = data?.map((loan) => ({
    ...loan,
    amount_paid:
      parseFloat(loan.loan_schedule_penalty_paid) +
      parseFloat(loan.loan_schedule_interest_paid) +
      parseFloat(loan.loan_schedule_principal_paid),
    balance:
      parseFloat(loan.loan_schedule_penalties) +
      parseFloat(loan.loan_schedule_interest) +
      parseFloat(loan.loan_schedule_principal) -
      (parseFloat(loan.loan_schedule_penalty_paid) +
        parseFloat(loan.loan_schedule_interest_paid) +
        parseFloat(loan.loan_schedule_principal_paid)),
  }));
  const {
    auth: { roles },
  } = useAuth();
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
        <p className="text-xs">
          {parseFloat(row.original.loan_schedule_principal).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "loan_schedule_principal_paid",
      header: "Principal Paid",
      cell: ({ row }) => (
        <p className="text-xs">
          {parseFloat(
            row.original.loan_schedule_principal_paid
          ).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "loan_schedule_interest",
      header: "Interest",
      cell: ({ row }) => (
        <p className="text-xs">
          {parseFloat(row.original.loan_schedule_interest).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "loan_schedule_interest_paid",
      header: "Interest Paid",
      cell: ({ row }) => (
        <p className="text-xs">
          {parseFloat(
            row.original.loan_schedule_interest_paid
          ).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "loan_schedule_penalties",
      header: "Penalties",
      cell: ({ row }) => (
        <p className="text-xs">
          {parseFloat(row.original.loan_schedule_penalties).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "loan_schedule_penalty_paid",
      header: "Penalties Paid",
      cell: ({ row }) => (
        <p className="text-xs">
          {parseFloat(row.original.loan_schedule_penalty_paid).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "loan_schedule_payment_status",
      header: "Payment Status",
      cell: ({ row }) => (
        <Badge className="capitalize text-xs">
          {row.original.loan_schedule_payment_status}
        </Badge>
      ),
    },
    {
      accessorKey: "loan_schedule_activity_status",
      header: "Activity Status",
      cell: ({ row }) => (
        <Badge className="capitalize text-xs">
          {row.original.loan_schedule_activity_status}
        </Badge>
      ),
    },
    {
      id: "amount_paid",
      header: "Amount Paid",
      cell: ({ row }) => (
        <p className="text-xs">{row.original.amount_paid.toLocaleString()}</p>
      ),
    },
    {
      id: "balance",
      header: "Balance",
      cell: ({ row }) => (
        <p className="text-xs">{row.original.balance.toLocaleString()}</p>
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
            )}{" "}
            {hasPermission(roles, 100085) && (
              <DropdownMenuItem
                onClick={() => handleOpenDialog("interest", row.original)}
              >
                Adjust Interest
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const [showPayModal, setShowPayModal] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const handleOpenPayModal = (data) => {
    setShowPayModal(true);
    setSchedule(data);
  };
  const handleClosePayModal = () => {
    setShowPayModal(false);
    setSchedule([]);
  };

  const [showDialog, setShowDialog] = useState(false);

  const [action, setAction] = useState("");

  const handleOpenDialog = (action, data) => {
    setShowDialog(true);
    setAction(action);
    setSchedule(data);
  };
  const handleCloseDialog = () => {
    setShowDialog(false);
    setAction("");
    setSchedule("");
  };

  const [showGeneralDialog, setShowGeneralDialog] = useState(false);

  const handleGeneralOpenDialog = (action) => {
    setShowGeneralDialog(true);
    setAction(action);
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
      const data = {
        data: exportData,
        loans: loansData,
        title: "Loan Amortization Schedule",
        totals: totals,
        colspan: 2,
        mode: {
          format: "A4-L",
          orientation: "L",
        },
      };
      // console.log(data);
      const response = await axiosPrivate.post(
        `/export/loan-schedule/pdf`,
        { data: data },
        { responseType: "blob", signal: controller.signal }
      );
      const unix = Math.round(+new Date() / 1000);
      const download_title = unix + "loan-schedule.pdf";
      fileDownload(response.data, download_title);
      setIsDownloading(false);
    } catch (error) {
      console.log(error);

      const errorMessage =
        error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: errorMessage,
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
            {hasPermission(roles, 100081) && (
              <Button
                size="sm"
                onClick={() => handleGeneralOpenDialog("interest")}
              >
                Adjust Interest
              </Button>
            )}
            {hasPermission(roles, 100082) && (
              <Button
                size="sm"
                onClick={() => onDownload()}
                disabled={isDownloading}
              >
                Download Schedule
              </Button>
            )}
          </>
        )}
      </div>
      <Datatable
        ref={tableRef}
        columns={columns}
        data={processedData ?? []}
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
