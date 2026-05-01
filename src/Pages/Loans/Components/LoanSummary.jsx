/* eslint-disable react/prop-types */
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import LoanAction from "./Forms/LoanAction";
import UpdateLoanApplicationDialog from "./Forms/UpdateLoanApplicationDialog";
import LoanDisbursementDialog from "./Forms/LoanDisbursementDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useParams } from "react-router-dom";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import EditLoanUser from "./Forms/EditLoanUser";
import useAuth from "@/MiddleWares/Hooks/useAuth";

const loanStatusBadge = (status) => {
  const s = (status || "").toLowerCase();
  const cls = {
    pending:     "bg-amber-100 text-amber-800 border-amber-300",
    processed:   "bg-blue-100 text-blue-800 border-blue-300",
    approved:    "bg-green-100 text-green-800 border-green-300",
    disbursed:   "bg-emerald-100 text-emerald-800 border-emerald-300",
    overdue:     "bg-red-100 text-red-700 border-red-300",
    rejected:    "bg-red-100 text-red-700 border-red-300",
    paid_off:    "bg-slate-100 text-slate-600 border-slate-300",
    settled:     "bg-slate-100 text-slate-600 border-slate-300",
    writternoff: "bg-gray-800 text-gray-100 border-gray-700",
    writtenoff:  "bg-gray-800 text-gray-100 border-gray-700",
    refinanced:  "bg-purple-100 text-purple-800 border-purple-300",
    active:      "bg-emerald-100 text-emerald-800 border-emerald-300",
    due_today:   "bg-orange-100 text-orange-800 border-orange-300",
  }[s] || "";
  return <Badge variant="outline" className={`capitalize font-medium ${cls}`}>{status}</Badge>;
};

const LoanSummary = ({ data, refetch, totals }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [action, setAction] = useState("");
  const axiosPrivate = useAxiosPrivate();
  const { loanid: loanId } = useParams();
  const {
    auth: { roles },
  } = useAuth();

  // helpers
  const n = (v) => Number(v || 0);
  const fmt = (v) => n(v).toLocaleString();

  // include monitoring in grand totals
  const totalSum = {
    total:
      n(totals?.total_principal) +
      n(totals?.total_interest) +
      n(totals?.total_penalties) +
      n(totals?.total_monitoring),
    paid:
      n(totals?.total_principal_paid) +
      n(totals?.total_interest_paid) +
      n(totals?.total_penalties_paid) +
      n(totals?.total_monitoring_paid),
    balance:
      n(totals?.total_principal) -
      n(totals?.total_principal_paid) +
      (n(totals?.total_interest) - n(totals?.total_interest_paid)) +
      (n(totals?.total_penalties) - n(totals?.total_penalties_paid)) +
      (n(totals?.total_monitoring) - n(totals?.total_monitoring_paid)),
  };

  const handleOpenDialog = (a) => {
    setShowDialog(true);
    setAction(a);
  };
  const handleCloseDialog = () => {
    setShowDialog(false);
    setAction("");
  };

  const [openLoanUpdateModal, setOpenLoanUpdateModal] = useState(false);
  const handleOpenLoanUpdateModal = () => setOpenLoanUpdateModal(true);
  const handleCloseLoanUpdateModal = () => setOpenLoanUpdateModal(false);

  const [openLoanDisburseModal, setOpenLoanDisburseModal] = useState(false);
  const handleOpenLoanDisburseModal = (a) => {
    setOpenLoanDisburseModal(true);
    setAction(a);
  };
  const handleCloseLoanDisburseModal = () => {
    setOpenLoanDisburseModal(false);
    setAction("");
  };

  const [openLoanUpdateUserModal, setOpenLoanUpdateUserModal] = useState(false);
  const handleOpenLoanUpdateMemberModal = () =>
    setOpenLoanUpdateUserModal(true);
  const handleCloseLoanUpdateMemberModal = () =>
    setOpenLoanUpdateUserModal(false);

  const togglePaymentStatus = async (currentStatus) => {
    const controller = new AbortController();
    try {
      await axiosPrivate.put(
        `/loans/applications`,
        {
          loan_application_auto_payment_status:
            currentStatus === "yes" ? "no" : "yes",
          loan_application_id: loanId,
        },
        { signal: controller.signal }
      );
      refetch();
    } catch (error) {
      console.error("Error updating auto payment status", error);
    }
  };

  return (
    <>
      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4 border p-6 rounded-lg shadow-sm">
        {data?.loan_application_status === "pending" &&
          hasPermission(roles, 100069) && (
            <Button size="sm" onClick={() => handleOpenDialog("process")}>
              Process Loan
            </Button>
          )}

        {data?.loan_application_status === "processed" &&
          hasPermission(roles, 100070) && (
            <Button size="sm" onClick={() => handleOpenDialog("approve")}>
              Approve Loan
            </Button>
          )}

        {data?.loan_application_status === "approved" &&
          hasPermission(roles, 100072) && (
            <>
              <Button
                size="sm"
                onClick={() => handleOpenLoanDisburseModal("disburse")}
              >
                Disburse Loan
              </Button>
              {openLoanDisburseModal && (
                <LoanDisbursementDialog
                  isOpen={openLoanDisburseModal}
                  onClose={handleCloseLoanDisburseModal}
                  defaultValues={data}
                  refetch={refetch}
                  action={action}
                />
              )}
            </>
          )}

        {data?.loan_application_status === "rejected" && (
          <span className="text-sm">
            This loan was rejected. Check the loan history for details.
          </span>
        )}

        {(data?.loan_application_status === "pending" ||
          data?.loan_application_status === "approved" ||
          data?.loan_application_status === "processed") &&
          hasPermission(roles, 100071) && (
            <Button
              size="sm"
              onClick={() => handleOpenDialog("reject")}
              variant="destructive"
            >
              Reject Loan
            </Button>
          )}

        {(data?.loan_application_status === "pending" ||
          data?.loan_application_status === "approved" ||
          data?.loan_application_status === "processed") &&
          hasPermission(roles, 100167) && (
            <>
              <Button size="sm" onClick={handleOpenLoanUpdateModal}>
                Update Loan Information
              </Button>
              {openLoanUpdateModal && (
                <UpdateLoanApplicationDialog
                  isOpen={openLoanUpdateModal}
                  onClose={handleCloseLoanUpdateModal}
                  defaultValues={data}
                  refetch={refetch}
                />
              )}
            </>
          )}

        {data?.loan_application_status === "disbursed" && (
          <>
            {hasPermission(roles, 100073) && (
              <Button size="sm" onClick={() => handleOpenDialog("payoff")}>
                Pay Off Loan
              </Button>
            )}
            {hasPermission(roles, 100074) && (
              <Button onClick={() => handleOpenDialog("writeoff")} size="sm">
                Write Off Loan
              </Button>
            )}
            {hasPermission(roles, 100075) && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={data?.loan_application_auto_payment_status === "yes"}
                  onCheckedChange={() =>
                    togglePaymentStatus(
                      data?.loan_application_auto_payment_status
                    )
                  }
                />
                <span className="text-sm">Auto Repayments</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Application Summary */}
      <h6 className="text-bold text-center mt-4">Application Summary</h6>
      <div className="grid grid-cols-2 text-sm gap-x-6 gap-y-4 border p-6 rounded-lg shadow-sm">
        <div className="flex gap-x-4 items-center">
          <Label className="w-1/3 font-semibold">Loan Tracking Code</Label>
          <span className="w-2/3">{data?.loan_application_code}</span>
        </div>
        <div className="flex gap-x-4 items-center">
          <Label className="w-1/3 font-semibold">Application Amount</Label>
          <span className="w-2/3">{fmt(data?.loan_application_amount)}</span>
        </div>
        <div className="flex gap-x-4 items-center">
          <Label className="w-1/3 font-semibold">Loan Product</Label>
          <span className="w-2/3">
            {data?.loan_product?.loan_product_title}
          </span>
        </div>
        <div className="flex gap-x-4 items-center">
          <Label className="w-1/3 font-semibold">Interest Rate</Label>
          <span className="w-2/3">
            {n(data?.loan_product?.loan_products_interest_rate)}% (
            <span className="capitalize">
              {data?.loan_product?.loan_product_type === "reducing_balance"
                ? "Reducing Balance"
                : "Fixed Interest"}
            </span>
            )
          </span>
        </div>
        <div className="flex gap-x-4 items-center">
          <Label className="w-1/3 font-semibold">Tenure</Label>
          <span className="w-2/3">
            {data?.loan_application_tenure_period}{" "}
            {data?.loan_product?.loan_product_interval === "monthly"
              ? "Months"
              : data?.loan_product?.loan_product_interval === "weekly"
              ? "Weeks"
              : data?.loan_product?.loan_product_interval === "daily"
              ? "Days"
              : "Years"}
          </span>
        </div>
        <div className="flex gap-x-4 items-center">
          <Label className="w-1/3 font-semibold">Application Status</Label>
          <span className="w-2/3">
            {loanStatusBadge(data?.loan_application_status)}
          </span>
        </div>
        <div className="flex gap-x-4 items-center">
          <Label className="w-1/3 font-semibold">Application Date</Label>
          <span className="w-2/3 capitalize">
            {formatDateTimestamp(data?.loan_application_date)}
          </span>
        </div>
        <div className="flex gap-x-4 items-center">
          <Label className="w-1/3 font-semibold">Loan Manager</Label>
          <span className="w-2/3 capitalize">
            <Button
              onClick={handleOpenLoanUpdateMemberModal}
              disabled={!hasPermission(roles, 100076)}
              size="sm"
              variant="outline"
            >
              {`${data?.user?.user_firstname} ${data?.user?.user_lastname}`}
            </Button>
          </span>
        </div>
        <div className="flex gap-x-4 items-center">
          <Label className="w-1/3 font-semibold">Branch</Label>
          <span className="w-2/3 capitalize">{data?.branch?.branch_name}</span>
        </div>
        <div className="flex gap-x-4 items-center">
          <Label className="w-1/3 font-semibold">Notes</Label>
          <span className="w-2/3 capitalize">
            {data?.loan_application_notes}
          </span>
        </div>
      </div>

      {/* Disbursement Summary */}
      {(data?.loan_application_status === "disbursed" ||
        data?.loan_application_status === "writternoff" ||
        data?.loan_application_status === "paid_off" ||
        data?.loan_application_status === "settled") && (
        <>
          <h6 className="text-bold text-center mt-6">Disbursement Summary</h6>
          <div className="grid grid-cols-2 text-sm gap-x-6 gap-y-4 border p-6 rounded-lg shadow-sm">
            <div className="flex gap-x-4 items-center">
              <Label className="w-1/3 font-semibold">
                Disbursed Interest Rate
              </Label>
              <span className="w-2/3">
                {
                  data?.loan_applied_settings_disbursement
                    ?.loan_applied_settings_disbursement_interest
                }{" "}
                %
              </span>
            </div>
            <div className="flex gap-x-4 items-center">
              <Label className="w-1/3 font-semibold">Disbursed Amount</Label>
              <span className="w-2/3">
                {fmt(
                  data?.loan_applied_settings_disbursement
                    ?.loan_applied_settings_disbursement_amount
                )}
              </span>
            </div>
            <div className="flex gap-x-4 items-center">
              <Label className="w-1/3 font-semibold">Disbursed Date</Label>
              <span className="w-2/3">
                {data?.loan_applied_settings_disbursement
                  ?.loan_applied_settings_disbursement_date
                  ? formatDateTimestamp(
                      data.loan_applied_settings_disbursement
                        .loan_applied_settings_disbursement_date
                    )
                  : "No Disbursement Date"}
              </span>
            </div>
            <div className="flex gap-x-4 items-center">
              <Label className="w-1/3 font-semibold">Disbursed Timestamp</Label>
              <span className="w-2/3">
                {formatDateTimestamp(
                  data?.loan_applied_settings_disbursement
                    ?.loan_applied_settings_disbursement_timestamp
                )}
              </span>
            </div>
            <div className="flex gap-x-4 items-center">
              <Label className="w-1/3 font-semibold">Disbursed Tenure</Label>
              <span className="w-2/3">
                {
                  data?.loan_applied_settings_disbursement
                    ?.loan_applied_settings_disbursement_tenure_period
                }{" "}
                {data?.loan_product?.loan_product_interval === "monthly"
                  ? "Months"
                  : data?.loan_product?.loan_product_interval === "weekly"
                  ? "Weeks"
                  : data?.loan_product?.loan_product_interval === "daily"
                  ? "Days"
                  : "Years"}
              </span>
            </div>
            <div className="flex gap-x-4 items-center">
              <Label className="w-1/3 font-semibold">Loan Status</Label>
              <span className="w-2/3">
                {loanStatusBadge(data?.loan_applied_settings_disbursement?.loan_applied_settings_disbursement_status)}
              </span>
            </div>

            {/* Grace & Penalty policy snapshot */}
            <div className="flex gap-x-4 items-center">
              <Label className="w-1/3 font-semibold">Grace Period</Label>
              <span className="w-2/3 capitalize">
                {data?.loan_product?.penalty_grace_period}{" "}
                {data?.loan_product?.penalty_grace_period_interval}
              </span>
            </div>
            <div className="flex gap-x-4 items-center">
              <Label className="w-1/3 font-semibold">Penalty</Label>
              <span className="w-2/3 capitalize">
                {n(data?.loan_product?.loan_product_penalty_amount)}{" "}
                {data?.loan_product?.loan_product_penalty_mode === "percentage"
                  ? "%"
                  : ""}{" "}
                ({data?.loan_product?.loan_product_penalty_interval})
              </span>
            </div>
          </div>
        </>
      )}

      {/* Loan Balance Summary (now includes Monitoring Fees) */}
      {(data?.loan_application_status === "disbursed" ||
        data?.loan_application_status === "writternoff" ||
        data?.loan_application_status === "paid_off" ||
        data?.loan_application_status === "settled") && (
        <>
          <h6 className="text-bold text-center mt-6">Loan Balance Summary</h6>
          <div className="border rounded-lg shadow-sm p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Category</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { label: "Principal",      total: totals?.total_principal,   paid: totals?.total_principal_paid },
                  { label: "Interest",       total: totals?.total_interest,    paid: totals?.total_interest_paid },
                  { label: "Penalties",      total: totals?.total_penalties,   paid: totals?.total_penalties_paid },
                  { label: "Monitoring Fees",total: totals?.total_monitoring,  paid: totals?.total_monitoring_paid },
                ].map(({ label, total, paid }) => {
                  const bal = Math.max(0, n(total) - n(paid));
                  return (
                    <TableRow key={label}>
                      <TableCell className="font-medium">{label}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(total)}</TableCell>
                      <TableCell className="text-right tabular-nums text-green-700 font-medium">{fmt(paid)}</TableCell>
                      <TableCell className={`text-right tabular-nums font-semibold ${bal > 0 ? "text-red-600" : "text-green-700"}`}>{fmt(bal)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>

              <TableFooter>
                <TableRow className="font-semibold text-base">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(totalSum.total)}</TableCell>
                  <TableCell className="text-right tabular-nums text-green-700">{fmt(totalSum.paid)}</TableCell>
                  <TableCell className={`text-right tabular-nums ${totalSum.balance > 0 ? "text-red-600" : "text-green-700"}`}>{fmt(totalSum.balance)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </>
      )}

      {/* Action dialogs */}
      {showDialog &&
        hasPermission(
          roles,
          [100069, 100070, 100072, 100071, 100073, 100074]
        ) && (
          <LoanAction
            isOpen={showDialog}
            onClose={handleCloseDialog}
            actionType={action}
            refetch={refetch}
          />
        )}

      {openLoanUpdateUserModal && (
        <EditLoanUser
          isOpen={openLoanUpdateUserModal}
          onClose={handleCloseLoanUpdateMemberModal}
          refetch={refetch}
        />
      )}
    </>
  );
};

export default LoanSummary;
