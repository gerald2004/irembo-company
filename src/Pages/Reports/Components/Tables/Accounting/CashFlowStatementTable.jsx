/* eslint-disable react/prop-types */
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CashFlowStatementTable = ({ data }) => {
  const renderSection = (title, items) => (
    <>
      <TableRow className="font-semibold">
        <TableCell colSpan={2} className="text-md">
          {title}
        </TableCell>
      </TableRow>
      {items.map((item, idx) => (
        <TableRow key={idx}>
          <TableCell>{item.label}</TableCell>
          <TableCell className="text-right">{parseFloat(item.amount).toLocaleString()}</TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="mt-4">
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {renderSection(
            "Cash from Operating Activities",
            data?.cash_from_operating_activities || []
          )}
          {renderSection(
            "Cash From Investments Activities",
            data?.cash_from_investment_activities || []
          )}
          {renderSection(
            "Cash from Financing Activities",
            data?.cash_from_financing_activities || []
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CashFlowStatementTable;
