/* eslint-disable react/prop-types */

import { Pie, PieChart, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";

// Chart configuration for genders and transaction types
const chartConfig = {
  deposits: {
    label: "Deposits",
    color: "hsl(var(--chart-1))",
  },
  withdraws: {
    label: "Withdraws",
    color: "hsl(var(--chart-2))",
  },
  male: {
    label: "Male",
    color: "hsl(var(--chart-3))",
  },
  female: {
    label: "Female",
    color: "hsl(var(--chart-4))",
  },
};

// Helper function to aggregate data by gender
function aggregateByGender(transactions, transactionType) {
  return transactions.reduce((acc, transaction) => {
    const gender = transaction.client_gender;

    // Find existing entry for gender
    const genderEntry = acc.find((entry) => entry.gender === gender);
    if (genderEntry) {
      // Increment the appropriate amount
      genderEntry[transactionType] += transaction.amount;
    } else {
      // Add new entry for gender with the respective color from chartConfig
      acc.push({
        gender,
        [transactionType]: transaction.amount,
        fill: chartConfig[gender?.toLowerCase()]?.color,
      });
    }

    return acc;
  }, []);
}

export function SavingsWithdrawByGender({ deposits = [], withdraws = [] }) {
  
  // Aggregate deposits and withdrawals by gender
  const depositsByGender = aggregateByGender(deposits, "deposits");
  const withdrawsByGender = aggregateByGender(withdraws, "withdraws");

  return (
    <Card className="flex flex-col max-w-[500px] mx-auto">
      <CardHeader className="items-center pb-0">
        <CardTitle>Deposits & Withdrawals by Gender</CardTitle>
        <Separator />
        <CardDescription>Aggregated view by gender</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[350px] max-w-[350px]"
        >
          <PieChart width={450} height={450}>
            <Tooltip
              content={
                <ChartTooltipContent
                  labelKey="gender"
                  indicator="line"
                  labelFormatter={(label) =>
                    chartConfig[label?.toLowerCase()]?.label
                  }
                />
              }
            />
            <Pie
              data={depositsByGender}
              dataKey="deposits"
              nameKey="gender"
              outerRadius={120} // Increase the radius for a larger chart
              innerRadius={80} // Increase for a larger inner circle
            />
            <Pie
              data={withdrawsByGender}
              dataKey="withdraws"
              nameKey="gender"
              innerRadius={130}
              outerRadius={160}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Showing total deposits and withdrawals by gender
        </div>
      </CardFooter>
    </Card>
  );
}
