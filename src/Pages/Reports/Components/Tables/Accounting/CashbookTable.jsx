/* eslint-disable react/prop-types */
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
} from "@/components/ui/table";
import { useState } from "react";
import { formatDateTimestamp } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 10;

const CashbookTable = ({ data }) => {
  const [page, setPage] = useState(1);

  const cashData = data?.cash || [];
  const bankData = data?.bank || [];
  const totals = data?.totals || {};

  const paginatedCash = cashData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );
  const paginatedBank = bankData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const totalPages = Math.max(
    Math.ceil(cashData.length / ITEMS_PER_PAGE),
    Math.ceil(bankData.length / ITEMS_PER_PAGE)
  );

  return (
    <div className="space-y-4 rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead colSpan={4} className="text-start">
              Cash Transactions
            </TableHead>
            <TableHead colSpan={4} className="text-start">
              Bank Transactions
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Balance</TableHead>

            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, idx) => (
            <TableRow key={idx}>
              {/* Cash side */}
              {paginatedCash[idx] ? (
                <>
                  <TableCell>
                    {formatDateTimestamp(paginatedCash[idx].date)}
                  </TableCell>
                  <TableCell>{paginatedCash[idx].description}</TableCell>
                  <TableCell className="text-right">
                    {paginatedCash[idx].debit > 0
                      ? `+${paginatedCash[idx].debit.toLocaleString()}`
                      : `-${paginatedCash[idx].credit.toLocaleString()}`}
                  </TableCell>
                  <TableCell className="text-right">
                    {paginatedCash[idx].balance.toLocaleString()}
                  </TableCell>
                </>
              ) : (
                <TableCell colSpan={4}></TableCell>
              )}

              {/* Bank side */}
              {paginatedBank[idx] ? (
                <>
                  <TableCell>
                    {formatDateTimestamp(paginatedBank[idx].date)}
                  </TableCell>
                  <TableCell>{paginatedBank[idx].description}</TableCell>
                  <TableCell className="text-right">
                    {paginatedBank[idx].debit > 0
                      ? `+${paginatedBank[idx].debit.toLocaleString()}`
                      : `-${paginatedBank[idx].credit.toLocaleString()}`}
                  </TableCell>
                  <TableCell className="text-right">
                    {paginatedBank[idx].balance.toLocaleString()}
                  </TableCell>
                </>
              ) : (
                <TableCell colSpan={4}></TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="font-bold">
              Opening Cash Balance
            </TableCell>
            <TableCell className="text-right font-bold">
              {totals?.cash_opening?.toLocaleString()}
            </TableCell>
            <TableCell colSpan={3} className="font-bold">
              Opening Bank Balance
            </TableCell>
            <TableCell className="text-right font-bold">
              {totals?.bank_opening?.toLocaleString()}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={3} className="font-bold text-green-700">
              Total Cash In
            </TableCell>
            <TableCell className="text-right font-bold text-green-700">
              {totals.cash_in?.toLocaleString()}
            </TableCell>
            <TableCell colSpan={3} className="font-bold text-green-700">
              Total Bank In
            </TableCell>
            <TableCell className="text-right font-bold text-green-700">
              {totals.bank_in?.toLocaleString()}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={3} className="font-bold text-red-700">
              Total Cash Out
            </TableCell>
            <TableCell className="text-right font-bold text-red-700">
              {totals.cash_out?.toLocaleString()}
            </TableCell>
            <TableCell colSpan={3} className="font-bold text-red-700">
              Total Bank Out
            </TableCell>
            <TableCell className="text-right font-bold text-red-700">
              {totals.bank_out?.toLocaleString()}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={3} className="font-bold">
              Closing Cash Balance
            </TableCell>
            <TableCell className="text-right font-bold">
              {totals.cash_closing?.toLocaleString()}
            </TableCell>
            <TableCell colSpan={3} className="font-bold">
              Closing Bank Balance
            </TableCell>
            <TableCell className="text-right font-bold">
              {totals.bank_closing?.toLocaleString()}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default CashbookTable;
