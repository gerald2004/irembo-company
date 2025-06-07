import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function DailySummary() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  return (
    <div className="p-4 space-y-8">
      <div className="flex items-center gap-4">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-[200px]"
        />
        <Button size="sm">Preview</Button>
      </div>

      {/* Loans Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Payments</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b font-semibold">
                <th className="p-2">Client Name</th>
                <th className="p-2">Loan No.</th>
                <th className="p-2">Paid Installment</th>
                <th className="p-2">Principal Paid (UGX)</th>
                <th className="p-2">Interest Paid (UGX)</th>
                <th className="p-2">Penalty Paid (UGX)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="text-center py-4">
                  There is no deposit made today
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Withdraw Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b font-semibold">
                <th className="p-2">Client Name</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Time</th>
                <th className="p-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="text-center py-4">
                  There is no withdraw made today
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Deposit Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Deposits</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b font-semibold">
                <th className="p-2">Client Name</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Time</th>
                <th className="p-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="text-center py-4">
                  There is no deposit made today
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
