/* eslint-disable react/prop-types */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import LoanAction from "./Forms/LoanAction";
import { LoanHistory } from "./Tables/LoanHistory";
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
import LoanFlagOffDialog from "./Forms/LoanFlagOffDialog";
import useAuth from "@/MiddleWares/Hooks/useAuth";

const loanStatusBadge = (status) => {
  const s = (status || "").toLowerCase();
  const cls = {
    pending:       "bg-amber-100 text-amber-800 border-amber-300",
    first_review:  "bg-sky-100 text-sky-800 border-sky-300",
    second_review: "bg-indigo-100 text-indigo-800 border-indigo-300",
    final_review:  "bg-violet-100 text-violet-800 border-violet-300",
    processed:     "bg-blue-100 text-blue-800 border-blue-300",
    approved:      "bg-green-100 text-green-800 border-green-300",
    disbursed:             "bg-emerald-100 text-emerald-800 border-emerald-300",
    pending_disbursement:  "bg-orange-100 text-orange-800 border-orange-300",
    overdue:               "bg-red-100 text-red-700 border-red-300",
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

const LoanSummary = ({ data, refetch, totals, onViewHistory }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [action, setAction] = useState("");
  const axiosPrivate = useAxiosPrivate();
  const { loanid: loanId } = useParams();
  const {
    auth: { roles },
  } = useAuth();

  // Fetch current user's loan workflow privileges
  const { data: pendingData } = useQuery({
    queryKey: ["loans-pending-privileges"],
    queryFn: () => axiosPrivate.get("/dashboards/loans-pending").then((r) => r.data?.data),
    staleTime: 60_000,
  });
  const myPrivileges = pendingData?.privileges ?? [];
  const hasLoanPrivilege = (type) => myPrivileges.includes(type);

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

  const [flagOffModal, setFlagOffModal] = useState({ open: false, mode: "flag" });
  const openFlagOff = (mode) => setFlagOffModal({ open: true, mode });
  const closeFlagOff = () => setFlagOffModal({ open: false, mode: "flag" });

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

        {/* ── Submit to workflow (Loan Officer) ─────────────────────────── */}
        {data?.loan_application_status === "pending" &&
          hasPermission(roles, 100069) && (
            <Button size="sm" onClick={() => handleOpenDialog("process")}>
              Submit for Review
            </Button>
          )}

        {/* ── Legacy approve (no workflow configured) ───────────────────── */}
        {data?.loan_application_status === "processed" &&
          hasPermission(roles, 100070) && (
            <Button size="sm" onClick={() => handleOpenDialog("approve")}>
              Approve Loan
            </Button>
          )}

        {/* ── First Approver actions ────────────────────────────────────── */}
        {data?.loan_application_status === "first_review" &&
          hasLoanPrivilege("first_approver") && (
            <>
              <Button size="sm" onClick={() => handleOpenDialog("first_approve")}>
                First Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleOpenDialog("send_back")}>
                Send Back
              </Button>
            </>
          )}

        {/* ── Second Approver actions ───────────────────────────────────── */}
        {data?.loan_application_status === "second_review" &&
          hasLoanPrivilege("second_approver") && (
            <>
              <Button size="sm" onClick={() => handleOpenDialog("second_approve")}>
                Second Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleOpenDialog("send_back")}>
                Send Back
              </Button>
            </>
          )}

        {/* ── Final Approver actions ────────────────────────────────────── */}
        {data?.loan_application_status === "final_review" &&
          hasLoanPrivilege("final_approver") && (
            <>
              <Button size="sm" onClick={() => handleOpenDialog("approve")}>
                Final Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleOpenDialog("send_back")}>
                Send Back
              </Button>
            </>
          )}

        {/* ── Disburse (disbursement officer or legacy perm) ───────────── */}
        {data?.loan_application_status === "approved" &&
          (hasLoanPrivilege("disbursement_officer") || hasPermission(roles, 100072)) && (
            <>
              <Button size="sm" onClick={() => handleOpenLoanDisburseModal("disburse")}>
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

        {data?.loan_application_status === "pending_disbursement" && (
          <span className="text-sm text-orange-800 bg-orange-50 border border-orange-200 rounded px-3 py-2">
            Disbursement awaiting manager approval — check the QMS Pending Actions queue.
          </span>
        )}

        {data?.loan_application_status === "rejected" && (
          <span className="text-sm text-red-700">
            This loan was rejected. Check the approval history below for details.
          </span>
        )}

        {/* ── Reject (any approver at current stage, or legacy perm) ───── */}
        {["pending","processed","first_review","second_review","final_review","approved"].includes(
          data?.loan_application_status
        ) &&
          (hasPermission(roles, 100071) ||
            (data?.loan_application_status === "first_review"  && hasLoanPrivilege("first_approver"))  ||
            (data?.loan_application_status === "second_review" && hasLoanPrivilege("second_approver")) ||
            (data?.loan_application_status === "final_review"  && hasLoanPrivilege("final_approver"))) && (
            <Button
              size="sm"
              onClick={() => handleOpenDialog("reject")}
              variant="destructive"
            >
              Reject Loan
            </Button>
          )}

        {/* ── Update loan details ───────────────────────────────────────── */}
        {["pending","processed","first_review","second_review","final_review","approved"].includes(
          data?.loan_application_status
        ) &&
          hasPermission(roles, 100167) && (
            <>
              <Button size="sm" variant="outline" onClick={handleOpenLoanUpdateModal}>
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
            {hasPermission(roles, 100280) && (
              data?.loan_flag_off_status === "flagged" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-500 text-green-700 hover:bg-green-50"
                  onClick={() => openFlagOff("unflag")}
                >
                  Reverse Flag-Off
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-orange-500 text-orange-700 hover:bg-orange-50"
                  onClick={() => openFlagOff("flag")}
                >
                  Flag Off Loan
                </Button>
              )
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
          <span className="w-2/3 flex items-center gap-2">
            {loanStatusBadge(data?.loan_application_status)}
            {data?.loan_flag_off_status === "flagged" && (
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 text-xs">
                Flagged Off
              </Badge>
            )}
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

      {/* Approval History Timeline */}
      {data?.loan_history && data.loan_history.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h6 className="text-sm font-semibold">Approval History</h6>
            {data.loan_history.length > 4 && onViewHistory && (
              <button
                onClick={onViewHistory}
                className="text-xs text-primary hover:underline"
              >
                View full history →
              </button>
            )}
          </div>
          <div className="border rounded-lg shadow-sm p-4">
            <LoanHistory data={data.loan_history} initialCount={4} capped />
          </div>
        </div>
      )}

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
      {showDialog && (
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

      {flagOffModal.open && (
        <LoanFlagOffDialog
          isOpen={flagOffModal.open}
          onClose={closeFlagOff}
          mode={flagOffModal.mode}
          refetch={refetch}
        />
      )}
    </>
  );
};

export default LoanSummary;
