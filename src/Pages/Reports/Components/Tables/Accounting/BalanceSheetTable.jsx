/* eslint-disable react/prop-types */
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const SectionTable = ({ title, data, net_income }) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Sub Group</TableHead>
              <TableHead>Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((item) => (
              <TableRow key={item?.account_id}>
                <TableCell>
                  <Link to={`/ledgers/accounts/${item.account_id}`}>
                    {item?.code}
                  </Link>
                </TableCell>
                <TableCell>{item?.title}</TableCell>
                <TableCell>{item?.sub_group?.title}</TableCell>
                <TableCell>{item?.balance?.toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {net_income && (
              <TableRow>
                <TableCell colSpan="3">
                  <strong>YTD Profit/Loss:</strong>
                </TableCell>
                <TableCell>{net_income?.toLocaleString()}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);

const BalanceSheetTable = ({ balanceSheet, totals }) => {
  const { assets, liabilities, equity } = balanceSheet;
  const { total_assets, total_liabilities, total_equity, net_income } = totals;

  return (
    <div className="space-y-6">
      <SectionTable title="Assets" data={assets} />
      <SectionTable title="Liabilities" data={liabilities} />
      <SectionTable title="Equity" data={equity} net_income={net_income} />

      <Card>
        <CardHeader>
          <CardTitle>Balance Sheet Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>Total Assets:</strong>
              <p>{total_assets?.toLocaleString()}</p>
            </div>
            <div>
              <strong>Total Liabilities:</strong>
              <p>{(total_liabilities + net_income)?.toLocaleString()}</p>
            </div>
            <div>
              <strong>Total Equity:</strong>
              <p>{total_equity?.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceSheetTable;
