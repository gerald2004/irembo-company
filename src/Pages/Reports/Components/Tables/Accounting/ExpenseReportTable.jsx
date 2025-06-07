/* eslint-disable react/prop-types */
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const ExpenseReportTable = ({ data = [], isLoading }) => {
  const total = data?.reduce((sum, row) => sum + parseFloat(row?.total), 0);

  if (isLoading) {
    return <Skeleton className="w-full h-10" />;
  }

  if (data?.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center">
        No records found.
      </p>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((entry, idx) => (
            <TableRow key={idx}>
              <TableCell>{entry?.account}</TableCell>
              <TableCell className="text-right">
                {parseFloat(entry?.total)?.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-bold">Total</TableCell>
            <TableCell className="text-right font-bold text-red-600">
              {parseFloat(total)?.toLocaleString()}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default ExpenseReportTable;
