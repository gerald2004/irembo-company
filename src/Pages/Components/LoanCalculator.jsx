/* eslint-disable react/prop-types */
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Download, X } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { axiosPrivate } from "@/Config/Axios";
import fileDownload from "js-file-download";

const LoanCalculator = ({ data, isOpen, onClose }) => {
  // support both shapes: {loanCalculator:{...}} or flat
  const payload = data?.loanCalculator ?? data ?? {};

  const loanData = payload?.loan_schedule ?? [];
  const loanProductData = payload?.loan_product ?? {};
  const extraCharges = payload?.charges ?? data?.loanCharges ?? []; // non-monitoring charges from API

  const { totalInterest, totalPrincipal } = useMemo(() => {
    const tInt  = loanData?.reduce((sum, r) => sum + Number(r?.interest  || 0), 0) || 0;
    const tPrin = loanData?.reduce((sum, r) => sum + Number(r?.principal || 0), 0) || 0;
    return { totalInterest: tInt, totalPrincipal: tPrin };
  }, [loanData]);

  // MONITORING FEES (still calculated for totals/export, but not shown in Charges table)
  const monitoringTotal = useMemo(() => {
    return loanData?.reduce((sum, r) => sum + Number(r?.fee || 0), 0) || 0;
  }, [loanData]);

  const [isDownloading, setIsDownloading] = useState(false);

  const onDownload = async () => {
    const controller = new AbortController();
    try {
      setIsDownloading(true);
      const send = {
        loanData,
        loanProductData,
        charges: extraCharges, // exclude monitoring from the bottom list
        monitoringTotal, // keep for PDF template if needed
        totalInterest,
        totalPrincipal,
      };
      const response = await axiosPrivate.post(
        `/export/loan-calculator/pdf`,
        { data: send },
        { responseType: "blob", signal: controller.signal }
      );
      const unix = Math.floor(Date.now() / 1000);
      fileDownload(response.data, `${unix}_loan-calculation.pdf`);
      setIsDownloading(false);
      onClose();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : String(errorMessage),
      });
      setIsDownloading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Loan Calculator</h2>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loan Calculator</DialogTitle>
            <DialogDescription>
              Enter loan details to calculate your monthly payments.
            </DialogDescription>
            <DialogClose asChild>
              <button
                className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </DialogHeader>

          {/* Loan Terms */}
          <div>
            <h6 className="capitalize text-center">Loan Terms</h6>
            <div className="border rounded-lg shadow-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Title</TableHead>
                    <TableHead className="text-center">Loan Type</TableHead>
                    <TableHead className="text-center">Interval</TableHead>
                    <TableHead className="text-center">
                      Interest Rate (%)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-center">
                      {loanProductData?.loan_product_title ?? "N/A"}
                    </TableCell>
                    <TableCell className="text-center capitalize">
                      {(loanProductData?.loan_product_type ===
                      "reducing_balance"
                        ? "Reducing Balance"
                        : "Fixed Interest") ?? "N/A"}
                    </TableCell>
                    <TableCell className="text-center capitalize">
                      {loanProductData?.loan_product_interval ?? "N/A"}
                    </TableCell>
                    <TableCell className="text-center">
                      {loanProductData?.loan_products_interest_rate ?? "N/A"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Loan Schedule */}
          <h6 className="capitalize text-center">Loan Schedule</h6>
          <div className="border rounded-lg shadow-md max-h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">Period</TableHead>
                  <TableHead className="text-end">Date</TableHead>
                  <TableHead className="text-end">Principal</TableHead>
                  <TableHead className="text-end">Interest</TableHead>
                  <TableHead className="text-end">Fees</TableHead>
                  <TableHead className="text-end">Payment</TableHead>
                  <TableHead className="text-end">Principal Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loanData?.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-end">
                      {row?.period ?? row?.no}
                    </TableCell>
                    <TableCell className="text-end">{row?.date}</TableCell>
                    <TableCell className="text-end">
                      {Number(row?.principal || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-end">
                      {Number(row?.interest || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-end">
                      {Number(row?.fee || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-end">
                      {Number(
                        row?.payment ?? row?.amount ?? 0
                      ).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-end">
                      {Number(row?.balance || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell className="text-end">Total</TableCell>
                  <TableCell className="text-end"></TableCell>
                  <TableCell className="text-end">
                    {Number(totalPrincipal).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-end">
                    {Number(totalInterest).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-end">
                    {Number(monitoringTotal).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-end">
                    {Number(
                      totalInterest + totalPrincipal + monitoringTotal
                    ).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-end"></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Charges — monitoring fees REMOVED here as requested */}
          <div>
            <h6 className="capitalize text-center">Charges</h6>
            <div className="border rounded-lg shadow-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-end">Charge Title</TableHead>
                    <TableHead className="text-end">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extraCharges?.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-end">{row?.title}</TableCell>
                      <TableCell className="text-end">
                        {row?.type === "value"
                          ? Number(row?.value || 0).toLocaleString()
                          : Number(
                              ((row?.value || 0) * totalPrincipal) / 100
                            ).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Actions */}
          <DialogFooter>
            <Button type="button" onClick={onDownload} disabled={isDownloading}>
              {isDownloading ? "Preparing..." : "Download"} <Download />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanCalculator;
