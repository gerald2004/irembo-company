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
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { formatDateTimestamp } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const TillSheetTable = ({ data = [], isLoading = false, totals = {} }) => {
  const [page, setPage] = useState(1);
  const perPage = 10;

  const paginatedData = data?.slice((page - 1) * perPage, page * perPage) || [];
  const totalPages = Math.ceil((data?.length || 0) / perPage);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data?.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center">
        No cashbook entries found.
      </p>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Cash In (Dr)</TableHead>
            <TableHead className="text-right">Cash Out (Cr)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((entry, idx) => (
            <TableRow key={idx}>
              <TableCell>{formatDateTimestamp(entry?.date)}</TableCell>
              <TableCell>{entry?.description}</TableCell>
              <TableCell className="text-right">
                {parseFloat(entry?.debit).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {parseFloat(entry?.credit).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2} className="font-bold">
              Totals
            </TableCell>
            <TableCell className="text-right font-bold text-green-600">
              {totals?.cash_in?.toLocaleString()}
            </TableCell>
            <TableCell className="text-right font-bold text-red-600">
              {totals?.cash_out?.toLocaleString()}
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
        <span className="text-sm text-muted-foreground px-2">
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

export default TillSheetTable;
