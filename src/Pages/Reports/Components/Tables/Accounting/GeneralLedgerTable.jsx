/* eslint-disable react/prop-types */
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { formatDateTimestamp } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const GeneralLedgerTable = ({ entries = [], isLoading = false }) => {
  const [page, setPage] = useState(1);
  const perPage = 10;

  const paginatedData =
    entries?.slice((page - 1) * perPage, page * perPage) || [];

  const totalPages = Math.ceil((entries?.length || 0) / perPage);

  const totalDebit =
    entries?.reduce((sum, entry) => sum + parseFloat(entry?.debit), 0) ?? 0;

  const totalCredit =
    entries?.reduce((sum, entry) => sum + parseFloat(entry?.credit), 0) ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    );
  }

  if (!entries || entries?.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center">
        No ledger entries found.
      </p>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
            <TableHead className="text-right">Running Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((entry, idx) => (
            <TableRow key={idx}>
              <TableCell>{formatDateTimestamp(entry?.date)}</TableCell>
              <TableCell>
                <Badge variant="secondary">{entry?.code}</Badge>
              </TableCell>
              <TableCell>{entry?.description}</TableCell>
              <TableCell className="text-right">
                {parseFloat(entry?.debit).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {parseFloat(entry?.credit).toLocaleString()}
              </TableCell>{" "}
              <TableCell className="text-right">
                {parseFloat(entry?.balance).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="font-bold">
              Totals
            </TableCell>
            <TableCell className="text-right font-bold text-green-600">
              {totalDebit?.toLocaleString()}
            </TableCell>
            <TableCell className="text-right font-bold text-red-600">
              {totalCredit?.toLocaleString()}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      {/* Pagination Controls */}
      <div className="flex justify-end items-center p-4">
        <Button
          size="sm"
          disabled={page === 1}
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground px-1">
          Page {page} of {totalPages}
        </span>
        <Button
          size="sm"
          disabled={page === totalPages}
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default GeneralLedgerTable;
