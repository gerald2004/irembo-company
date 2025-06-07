/* eslint-disable react/prop-types */
import { TrendingUp } from "lucide-react";
import { Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoansByGenderPieChart({ loans_gender }) {
  const chartData = [
    {
      category: "Male",
      totalCount: loans_gender?.individual?.male?.totalCount || 0,
      totalAmount: loans_gender?.individual?.male?.totalAmount || 0,
      fill: "hsl(var(--chart-1))",
    },
    {
      category: "Female",
      totalCount: loans_gender?.individual?.female?.totalCount || 0,
      totalAmount: loans_gender?.individual?.female?.totalAmount || 0,
      fill: "hsl(var(--chart-2))",
    },
    {
      category: "Group",
      totalCount: loans_gender?.group?.totalCount || 0,
      totalAmount: loans_gender?.group?.totalAmount || 0,
      fill: "hsl(var(--chart-3))",
    },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Loans by Gender</CardTitle>
        <CardDescription>Individual and Group Loans</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div className="mx-auto aspect-square max-h-[350px] max-w-[350px]">
          <PieChart width={350} height={350}>
            <Pie
              data={chartData}
              dataKey="totalAmount"
              label={(entry) => `${entry.category}`}
              fill={(entry) => entry.fill}
              nameKey="category"
            />
          </PieChart>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 0% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing loan disbursements categorized by gender and type
        </div>
      </CardFooter>
    </Card>
  );
}
