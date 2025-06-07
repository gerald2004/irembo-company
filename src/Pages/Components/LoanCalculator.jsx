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
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { axiosPrivate } from "@/Config/Axios";
import fileDownload from "js-file-download";

const LoanCalculator = ({ data, isOpen, onClose }) => {
  const loanData = data?.loanCalculator?.loan_schedule;
  const loanProductData = data?.loanCalculator?.loan_product;
  const charges = data.loanCharges;

  // Calculate totals
  const totalInterest =
    Math.round(loanData?.reduce((sum, row) => sum + row?.interest, 0) / 10) *
    10;

  const totalPrincipal =
    Math.round(loanData?.reduce((sum, row) => sum + row?.principal, 0) / 10) *
    10;

  const [isDownloading, setIsDownloading] = useState(false);

  const onDownload = async () => {
    const controller = new AbortController();
    try {
      setIsDownloading(true);
      const data = {
        loanData,
        loanProductData,
        charges,
        totalInterest,
        totalPrincipal,
      };
      const response = await axiosPrivate.post(
        `/export/loan-calculator/pdf`,
        { data: data },
        { responseType: "blob", signal: controller.signal }
      );
       const unix = Math.round(+new Date() / 1000);
      const download_title = unix + "_loan-calculation.pdf";
      fileDownload(response.data, download_title);
      setIsDownloading(false);
      onClose();
    } catch (error) {
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
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Loan Calculator</h2>

      {/* Open Dialog Button */}
      <Dialog open={isOpen} onOpenChange={() => {}}>
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
          {/* Loan Schedule Table */}
          <h6 className="capitalize text-center">Loan Schedule</h6>
          <div className="border rounded-lg shadow-md max-h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">Period</TableHead>
                  <TableHead className="text-end">Date</TableHead>
                  <TableHead className="text-end">Principal</TableHead>
                  <TableHead className="text-end">Interest</TableHead>
                  <TableHead className="text-end">Payment</TableHead>
                  <TableHead className="text-end">Principal Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loanData?.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-end">{row?.period}</TableCell>
                    <TableCell className="text-end">{row?.date}</TableCell>
                    <TableCell className="text-end">
                      {row?.principal?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-end">
                      {row?.interest?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-end">
                      {row?.payment?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-end">
                      {row?.balance?.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell className="text-end">Total</TableCell>
                  <TableCell className="text-end"></TableCell>
                  <TableCell className="text-end">
                    {totalPrincipal?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-end">
                    {totalInterest?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-end">
                    {(totalInterest + totalPrincipal)?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-end"></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

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
                  {charges?.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-end">{row?.title}</TableCell>
                      <TableCell className="text-end">
                        {row?.type === "value"
                          ? row?.value?.toLocaleString()
                          : (
                              (row?.value * totalPrincipal) /
                              100
                            ).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Buttons */}
          <DialogFooter>
            <Button type="submit" onClick={onDownload} disabled={isDownloading}>
              Download <Download />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanCalculator;
