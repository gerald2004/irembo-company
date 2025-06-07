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

const PaginatedTable = ({ title, data = [], totalAmount = 0, isLoading }) => {
  const [page, setPage] = useState(1);
  const perPage = 10;

  const paginatedData = data?.slice((page - 1) * perPage, page * perPage);
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
        No  records found.
      </p>
    );
  }

  return (
    <div className="mb-8 w-full overflow-x-auto rounded-md border">
      <h4 className="text-lg font-semibold px-4 py-2">{title}</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Account</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((entry, idx) => (
            <TableRow key={idx}>
              <TableCell>{formatDateTimestamp(entry?.date)}</TableCell>
              <TableCell>{entry?.description}</TableCell>
              <TableCell>{entry?.account}</TableCell>
              <TableCell className="text-right">
                {parseFloat(entry?.amount).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="font-bold">
              Total
            </TableCell>
            <TableCell className="text-right font-bold text-blue-600">
              {parseFloat(totalAmount).toLocaleString()}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

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

const DaySheetTable = ({ data, isLoading }) => {
  console.log(data);
  
  return (
    <div className="space-y-6">
      <PaginatedTable
        title="Inflow"
        data={data?.deposits}
        totalAmount={data?.totals?.deposits}
        isLoading={isLoading}
      />
      <PaginatedTable
        title="Outflow"
        data={data?.withdrawals}
        totalAmount={data?.totals?.withdrawals}
        isLoading={isLoading}
      />
    </div>
  );
};

export default DaySheetTable;
