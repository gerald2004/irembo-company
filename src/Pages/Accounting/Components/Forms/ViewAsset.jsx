/* eslint-disable react/prop-types */
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const ViewAsset = ({ isOpen, onClose, asset }) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>View Asset</DialogTitle>
          <DialogDescription>Review the asset details below.</DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        {/* Asset Info */}
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <strong>Asset Name:</strong> {asset?.asset_name}
          </div>
          <div>
            <strong>Identification No:</strong> {asset?.identification_no}
          </div>
          <div>
            <strong>Purchase Cost:</strong> {" "}
            {parseFloat(asset?.purchase_cost).toLocaleString()}
          </div>
          <div>
            <strong>Purchase Date:</strong> {asset?.date}
          </div>
          <div>
            <strong>Put To Use:</strong> {asset?.date_put_to_use}
          </div>
          <div>
            <strong>Method:</strong>{" "}
            {asset?.method === "straight_line"
              ? "Straight Line"
              : asset?.method === "double_declining" ? "Double Declining": asset?.method === "apprecaition" ? "Appreciation" : ""}
          </div>
          <div>
            <strong>Rate (%):</strong> {asset?.rate}
          </div>
          <div>
            <strong>Expected Age:</strong> {asset?.expected_age} yrs
          </div>
          <div>
            <strong>Branch:</strong> {asset?.branch}
          </div>
          <div>
            <strong>Book Value:</strong> {" "}
            {parseFloat(asset?.book_value).toLocaleString()}
          </div>
          <div>
            <strong>
              {asset?.method === "appreciation"
                ? "Accumulated Amount"
                : "Depreciated Amount"}
              :
            </strong>{" "}
            {parseFloat(asset?.accumulated).toLocaleString()}
          </div>
        </div>

        {/* Accounts */}
        <div className="mt-6">
          <h4 className="text-base font-semibold mb-2">Associated Accounts</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {asset?.asset_debit_account && (
              <li>
                <strong>Asset Debit:</strong> [
                {asset.asset_debit_account.account_code}]{" "}
                {asset.asset_debit_account.account_title}
              </li>
            )}
            {asset?.depreciation_expense_account && (
              <li>
                <strong>Depreciation Expense:</strong> [
                {asset.depreciation_expense_account.account_code}]{" "}
                {asset.depreciation_expense_account.account_title}
              </li>
            )}
            {asset?.depreciation_loss_account && (
              <li>
                <strong>Depreciation Loss:</strong> [
                {asset.depreciation_loss_account.account_code}]{" "}
                {asset.depreciation_loss_account.account_title}
              </li>
            )}
            {asset?.depreciation_gain_account && (
              <li>
                <strong>Depreciation Gain:</strong> [
                {asset.depreciation_gain_account.account_code}]{" "}
                {asset.depreciation_gain_account.account_title}
              </li>
            )}
            {asset?.appreciation_account && (
              <li>
                <strong>Appreciation:</strong> [
                {asset.appreciation_account.account_code}]{" "}
                {asset.appreciation_account.account_title}
              </li>
            )}
            {asset?.appreciation_income_account && (
              <li>
                <strong>Appreciation Income:</strong> [
                {asset.appreciation_income_account.account_code}]{" "}
                {asset.appreciation_income_account.account_title}
              </li>
            )}
            {asset?.appreciation_loss_account && (
              <li>
                <strong>Appreciation Loss:</strong> [
                {asset.appreciation_loss_account.account_code}]{" "}
                {asset.appreciation_loss_account.account_title}
              </li>
            )}
            {asset?.appreciation_gain_account && (
              <li>
                <strong>Appreciation Gain:</strong> [
                {asset.appreciation_gain_account.account_code}]{" "}
                {asset.appreciation_gain_account.account_title}
              </li>
            )}
          </ul>
        </div>

        {/* Footer */}
        <DialogFooter>
          <div className="flex justify-end w-full">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewAsset;
