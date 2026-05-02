/* eslint-disable react/prop-types */
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const fmtNum = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(parseFloat(v) || 0);

const sectionTotal = (items) =>
  (items ?? []).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

const CashFlowStatementTable = ({ data }) => {
  const renderSection = (title, items) => {
    const total = sectionTotal(items);
    return (
      <>
        <TableRow className="bg-muted/40">
          <TableCell colSpan={2} className="font-semibold text-sm py-2">
            {title}
          </TableCell>
        </TableRow>
        {(items ?? []).map((item, idx) => (
          <TableRow key={idx}>
            <TableCell className="pl-6 text-xs">{item.label}</TableCell>
            <TableCell className="text-right text-xs tabular-nums">
              {fmtNum(item.amount)}
            </TableCell>
          </TableRow>
        ))}
        <TableRow className="border-t">
          <TableCell className="pl-6 text-xs font-medium text-muted-foreground">
            Subtotal — {title}
          </TableCell>
          <TableCell className="text-right text-xs font-semibold tabular-nums">
            {fmtNum(total)}
          </TableCell>
        </TableRow>
      </>
    );
  };

  const operating  = sectionTotal(data?.cash_from_operating_activities);
  const investment = sectionTotal(data?.cash_from_investment_activities);
  const financing  = sectionTotal(data?.cash_from_financing_activities);
  const netChange  = operating + investment + financing;

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Description</TableHead>
            <TableHead className="text-right w-40">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {renderSection("Cash from Operating Activities",  data?.cash_from_operating_activities)}
          {renderSection("Cash from Investment Activities", data?.cash_from_investment_activities)}
          {renderSection("Cash from Financing Activities",  data?.cash_from_financing_activities)}
        </TableBody>
        <tfoot>
          <tr className="border-t-2 bg-muted/30">
            <td className="px-4 py-2 font-bold text-sm">Net Change in Cash</td>
            <td className={`px-4 py-2 text-right font-bold text-sm tabular-nums ${netChange >= 0 ? "text-green-700" : "text-red-700"}`}>
              {netChange >= 0 ? "+" : ""}{fmtNum(netChange)}
            </td>
          </tr>
        </tfoot>
      </Table>
    </div>
  );
};

export default CashFlowStatementTable;
