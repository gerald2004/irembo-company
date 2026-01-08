/* eslint-disable react/prop-types */
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Printer } from "lucide-react";
import { formatDateTimestamp } from "@/lib/utils";
import { toWords } from "number-to-words";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
export default function InvoicePOS({ data, onClose, isOpen }) {
  const printRef = useRef(null);
  const [paperSize, setPaperSize] = useState("80mm");
  const { sacco, transaction, client, title } = data;
  const handlePrint = () => {
    if (!printRef.current) return;

    const html = printRef.current.outerHTML;
    const paperWidth =
      paperSize === "58mm" ? "210px" : paperSize === "80mm" ? "300px" : "595px";

    const w = window.open("", "_blank", `width=800,height=600`);
    if (!w) return;

    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt</title>
        <link href="/tailwind.css" rel="stylesheet" />
        <style>
          @media print {
            body {
              margin: 0;
              padding: 0;
              width: ${paperWidth};
            }
          }

      * {
        color: black !important;
        background: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        font-weight: bold !important;
      }

        body {
          font-family: 'monospace', 'Courier New', Courier, sans-serif;
          margin: 0;
          padding: 10px;
          width: ${paperWidth};
          background: white;
          color: black;
        }

        .no-print {
          display: none !important;
        }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `);

    w.document.close();

    // Wait for the content to fully render
    w.onload = () => {
      w.focus();
      w.print();
      w.close();
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className={`p-4 ${
          paperSize === "58mm"
            ? "w-[210px]"
            : paperSize === "80mm"
            ? "w-[300px]"
            : "w-[595px]"
        }`}
      >
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
          <DialogDescription>{"Print this receipt"}</DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              onClick={onClose}
            >
              ×
            </button>
          </DialogClose>
        </DialogHeader>
        <div className="mb-2 text-sm text-left">
          <label className="font-medium mb-1 block">Paper Size</label>
          <Select value={paperSize} onValueChange={setPaperSize}>
            <SelectTrigger className="w-full h-9 text-xs">
              <SelectValue placeholder="Select paper size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="58mm">58mm (Small)</SelectItem>
              <SelectItem value="80mm">80mm (Standard)</SelectItem>
              <SelectItem value="a4">A4 (Full Page)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Printable area */}
        <Card ref={printRef} className="border-0 shadow-none w-full">
          <CardContent className="px-4 py-2 font-mono text-[11px] leading-snug text-center">
            <div className="space-y-[2px]">
              <p>
                <strong>{sacco?.name}</strong>
              </p>
              <p>{sacco?.address}</p>
              <p>{sacco?.email}</p>
              <p>{sacco?.contact}</p>
              <p>{sacco?.branchName}</p>
            </div>

            <hr className="my-2 border-dashed" />
            {title}
            <hr className="my-2 border-dashed" />
            <div className="space-y-[2px]">
              <p>Account : {client?.accountNumber}</p>
              <p>Customer : {client?.accountName}</p>
              <p>Txn No : {transaction?.transactionId}</p>
              <p>Date : {formatDateTimestamp(transaction?.timestamp)}</p>
              <p>Teller : {transaction?.user}</p>
            </div>

            <hr className="my-2 border-dashed" />

            <div className="space-y-[2px]">
              <p className="flex justify-center">
                <span>Amount: </span>
                <span className="font-semibold">
                  {transaction?.amount.toLocaleString()}
                </span>
              </p>
              <p className="capitalize">
                In words : {toWords(transaction?.amount)} Shillings
              </p>
              {transaction?.notary && <p>Notary : {transaction?.notary}</p>}
              {transaction?.notes && <p>Notes : {transaction?.notes}</p>}
            </div>

            <hr className="my-2 border-dashed" />

            <div className="text-center space-y-1">
              <p className="font-semibold">Thank you for choosing us.</p>
              <p>
                Powered by{" "}
                <span className="font-medium">
                  {import.meta.env.VITE_APP_POWERED_BY}{" "}
                  {import.meta.env.VITE_APP_COMPANY}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="p-4 print:hidden">
          <Button onClick={handlePrint} className="w-full" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
