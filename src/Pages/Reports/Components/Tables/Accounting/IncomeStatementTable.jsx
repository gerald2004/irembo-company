/* eslint-disable react/prop-types */
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const IncomeStatementTable = ({ data }) => {
  const { income = [], expenses = [] } = data.income_statement || {};
  const { total_income, total_expenses, net_income } = data.totals || {};

  return (
    <div className="border rounded-md p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Income Statement</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead>Code</TableHead>
            <TableHead className="text-right">Amount ()</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {/* INCOME */}
          <TableRow>
            <TableCell colSpan={3}>
              <Badge variant="outline" className="bg-green-100 text-green-700">
                Income
              </Badge>
            </TableCell>
          </TableRow>
          {income.map((acc) => (
            <TableRow key={acc.account_id}>
              <TableCell>
                <Link to={`/ledgers/accounts/${acc.account_id}`}>
                  {acc.title}
                </Link>
              </TableCell>
              <TableCell>
                <Link to={`/ledgers/accounts/${acc.account_id}`}>
                  {acc.code}
                </Link>
              </TableCell>
              <TableCell className="text-right">
                {parseFloat(acc.amount).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={2} className="font-semibold">
              Total Income
            </TableCell>
            <TableCell className="text-right font-semibold text-green-600">
              {parseFloat(total_income).toLocaleString()}
            </TableCell>
          </TableRow>

          {/* EXPENSES */}
          <TableRow>
            <TableCell colSpan={3} className="pt-4">
              <Badge variant="outline" className="bg-red-100 text-red-700">
                Expenses
              </Badge>
            </TableCell>
          </TableRow>
          {expenses.map((acc) => (
            <TableRow key={acc.account_id}>
              <TableCell>
                <Link to={`/ledgers/accounts/${acc.account_id}`}>
                  {acc.title}
                </Link>
              </TableCell>
              <TableCell>
                <Link to={`/ledgers/accounts/${acc.account_id}`}>
                  {acc.code}
                </Link>
              </TableCell>
              <TableCell className="text-right">
                {parseFloat(acc.amount).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={2} className="font-semibold">
              Total Expenses
            </TableCell>
            <TableCell className="text-right font-semibold text-red-600">
              {parseFloat(total_expenses).toLocaleString()}
            </TableCell>
          </TableRow>

          {/* NET INCOME */}
          <TableRow className="bg-muted">
            <TableCell colSpan={2} className="font-bold">
              Net Income
            </TableCell>
            <TableCell className="text-right font-bold text-blue-600">
              {parseFloat(net_income).toLocaleString()}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default IncomeStatementTable;
