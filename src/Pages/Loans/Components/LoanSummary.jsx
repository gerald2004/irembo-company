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
const LoanSummary = ({ data, refetch, totals }) => {
  const [showDialog, setShowDialog] = useState(false);
  const axiosPrivate = useAxiosPrivate();
  const [action, setAction] = useState("");
  const { loanid: loanId } = useParams();

  const handleOpenDialog = (action) => {
    setShowDialog(true);
    setAction(action);
  };
  const handleCloseDialog = () => {
    setShowDialog(false);
    setAction("");
  };

  const [openLoanUpdateModal, setOpenLoanUpdateModal] = useState(false);
  const handleOpenLoanUpdateModal = () => setOpenLoanUpdateModal(true);
  const handleCloseLoanUpdateModal = () => setOpenLoanUpdateModal(false);

  const [openLoanDisburseModal, setOpenLoanDisburseModal] = useState(false);
  const handleOpenLoanDisburseModal = (action) => {
    setOpenLoanDisburseModal(true);
    setAction(action);
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

  const totalSum = {
    total:
      (totals?.total_principal || 0) +
      (totals?.total_interest || 0) +
      (totals?.total_penalties || 0),
    paid:
      (totals?.total_principal_paid || 0) +
      (totals?.total_interest_paid || 0) +
      (totals?.total_penalties_paid || 0),
    balance:
      (totals?.total_principal - totals?.total_principal_paid || 0) +
      (totals?.total_interest - totals?.total_interest_paid || 0) +
      (totals?.total_penalties - (totals?.total_penalties_paid || 0)),
  };

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
      console.error("Error updating account status", error);
    }
  };
  const {
    auth: { roles },
  } = useAuth();
  return (
    <>
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
            This is loan was rejected. Kindly Check the loan history to for more
            information.
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
              <div>
                <Switch
                  checked={data?.loan_application_auto_payment_status === "yes"}
                  onCheckedChange={() =>
                    togglePaymentStatus(
                      data?.loan_application_auto_payment_status
                    )
                  }
                ></Switch>{" "}
                <span className="text-sm mb-5">Auto Repayments</span>
              </div>
            )}
          </>
        )}
      </div>

      <h6 className="text-bold text-center">Application Summary</h6>
      <div className="grid grid-cols-2 text-sm gap-x-6 gap-y-4 border p-6 rounded-lg shadow-sm">
        {/* Loan Information */}
        <div className="flex gap-x-4 items-center">
          <Label className="w-1/3 font-semibold">Loan Tracking Code</Label>
          <span className="w-2/3">{data?.loan_application_code}</span>
        </div>
        <div className="flex gap-x-4 items-center">
          <Label className="w-1/3 font-semibold">Application Amount</Label>
          <span className="w-2/3">
            {parseFloat(data?.loan_application_amount).toLocaleString()}
          </span>
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
            {data?.loan_product?.loan_products_interest_rate}% (
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
          <span className="w-2/3 capitalize">
            <Badge>{data?.loan_application_status}</Badge>
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
      {(data?.loan_application_status === "disbursed" ||
        data?.loan_application_status === "writternoff" ||
        data?.loan_application_status === "paid_off" ||
        data?.loan_application_status === "settled") && (
        <>
          <h6 className="text-bold text-center">Disbursement Summary</h6>
          <div className="grid grid-cols-2 text-sm gap-x-6 gap-y-4 border p-6 rounded-lg shadow-sm">
            {/* Loan Information */}
            <div className="flex gap-x-4 items-center">
              <Label className="w-1/3 font-semibold">
                Disbursed Interest Rate
              </Label>
              <span className="w-2/3">
                {
                  data?.loan_applied_settings_disbursement
                    ?.loan_applied_settings_disurbment_interest
                }{" "}
                %
              </span>
            </div>
            <div className="flex gap-x-4 items-center">
              <Label className="w-1/3 font-semibold">Disbursed Amount</Label>
              <span className="w-2/3">
                {parseFloat(
                  data?.loan_applied_settings_disbursement
                    ?.loan_applied_settings_disurbment_amount
                ).toLocaleString()}
              </span>
            </div>
            <div className="flex gap-x-4 items-center">
              <Label className="w-1/3 font-semibold">Disbursed Date</Label>
              <span className="w-2/3">
                {data?.loan_applied_settings_disbursement
                  ?.loan_applied_settings_disurbment_date
                  ? formatDateTimestamp(
                      data.loan_applied_settings_disbursement
                        .loan_applied_settings_disurbment_date
                    )
                  : // Extracts only YYYY-MM-DD
                    "No Disbursement Date"}
              </span>
            </div>
            <div className="flex gap-x-4 items-center">
              <Label className="w-1/3 font-semibold">Disbursed Timestamp</Label>
              <span className="w-2/3">
                {formatDateTimestamp(
                  data?.loan_applied_settings_disbursement
                    ?.loan_applied_settings_disurbment_timestamp
                )}
              </span>
            </div>
            <div className="flex gap-x-4 items-center">
              <Label className="w-1/3 font-semibold">Disbursed Tenure</Label>
              <span className="w-2/3">
                {
                  data?.loan_applied_settings_disbursement
                    ?.loan_applied_settings_disurbment_tenure_period
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
              <span className="w-2/3 capitalize">
                <Badge>
                  {
                    data?.loan_applied_settings_disbursement
                      ?.loan_applied_settings_disurbment_status
                  }
                </Badge>
              </span>
            </div>
            <div className="flex gap-x-4 items-center">
              <Label className="w-1/3 font-semibold">Grace Period</Label>
              <span className="w-2/3 capitalize">
                {data?.loan_product?.penalty_grace_period}{" "}
                {data?.loan_product?.penalty_grace_period_interval}
              </span>
            </div>

            <div className="flex gap-x-4 items-center">
              <Label className="w-1/3 font-semibold">Penalty </Label>
              <span className="w-2/3 capitalize">
                {parseFloat(data?.loan_product?.loan_product_penalty_amount)}{" "}
                {data?.loan_product?.loan_product_penalty_mode === "percentage"
                  ? "%"
                  : ""}{" "}
                ({data?.loan_product?.loan_product_penalty_interval})
              </span>
            </div>
          </div>
        </>
      )}
      {(data?.loan_application_status === "disbursed" ||
        data?.loan_application_status === "writternoff" ||
        data?.loan_application_status === "paid_off" ||
        data?.loan_application_status === "settled") && (
        <>
          <h6 className="text-bold text-center">Loan Balance Summary</h6>
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
                {/* Principal */}
                <TableRow>
                  <TableCell>Principal</TableCell>
                  <TableCell className="text-right">
                    {totals?.total_principal?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {totals?.total_principal_paid?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {(
                      totals?.total_principal - totals?.total_principal_paid
                    )?.toLocaleString()}
                  </TableCell>
                </TableRow>

                {/* Interest */}
                <TableRow>
                  <TableCell>Interest</TableCell>
                  <TableCell className="text-right">
                    {totals?.total_interest?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {totals?.total_interest_paid?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {(
                      totals?.total_interest - totals?.total_interest_paid
                    )?.toLocaleString()}
                  </TableCell>
                </TableRow>

                {/* Penalties */}
                <TableRow>
                  <TableCell>Penalties</TableCell>
                  <TableCell className="text-right">
                    {totals?.total_penalties?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {totals?.total_penalties_paid
                      ? totals?.total_penalties_paid.toLocaleString()
                      : "0"}
                  </TableCell>
                  <TableCell className="text-right">
                    {(
                      totals?.total_penalties -
                      (totals?.total_penalties_paid || 0)
                    )?.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
              <TableFooter>
                <TableRow className="font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">
                    {totalSum.total.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {totalSum.paid.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {totalSum.balance.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </>
      )}
      {showDialog &&
        hasPermission(roles,[100069, 100070, 100072, 100071, 100073, 100074]) && (
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
