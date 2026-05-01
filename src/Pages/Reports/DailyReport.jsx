import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DailyReportQuery from "./Components/Blocks/Queries/DailyReportQuery";
import { useState } from "react";

const DailyReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    date: "",
    branch_id: "",
  });
  const {
    data: report = [],
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["daily-report", filters],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `reports/daily-report`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          params: {
            date: filters.date,
            branch_id: filters.branch_id,
          },
          signal: controller.signal,
        });
        return response?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    // enabled: !!filters.date && !!filters.branch_id,
    placeholderData: (prev) => prev,
  });
  const handleFilterChange = (data) => {
    setFilters(data);
    refetch();
  };
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Daily Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">Daily Reports</h5>
          </div>
          <DailyReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Savings */}
            <Card>
              <CardHeader>
                <CardTitle>General Deposits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground text-sm">
                  Transactions: {report?.savings?.count}
                </p>
                <p className="text-xl font-bold text-green-600">
                  {report?.savings?.amount?.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* Withdrawals */}
            <Card>
              <CardHeader>
                <CardTitle>General Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground text-sm">
                  Transactions: {report?.withdrawals?.count}
                </p>
                <p className="text-xl font-bold text-red-600">
                  {report?.withdrawals?.amount?.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>External Incomes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground text-sm">
                  Transactions: {report?.incomes?.count}
                </p>
                <p className="text-xl font-bold">
                  {report?.incomes?.amount?.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground text-sm">
                  Transactions: {report?.expenses?.count}
                </p>
                <p className="text-xl font-bold">
                  {report?.expenses?.amount?.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Transfers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground text-sm">
                  Transactions: {report?.transfers?.count}
                </p>
                <p className="text-xl font-bold">
                  {report?.transfers?.amount?.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* Loans Disbursed */}
            <Card>
              <CardHeader>
                <CardTitle>Loans Disbursed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground text-sm">
                  Count: {report?.loans_disbursed?.count}
                </p>
                <p className="text-xl font-bold text-blue-600">
                  {report?.loans_disbursed?.amount?.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* Loan Repayments */}
            <Card>
              <CardHeader>
                <CardTitle>Loan Repayments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground text-sm">
                  Principal: {" "}
                  {report?.loan_repayments?.principal?.toLocaleString()}
                </p>
                <p className="text-foreground text-sm">
                  Interest: {" "}
                  {report?.loan_repayments?.interest?.toLocaleString()}
                </p>
                <p className="text-foreground text-sm">
                  Penalty: {" "}
                  {report?.loan_repayments?.penalty?.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* Loans Overdue Today */}
            <Card>
              <CardHeader>
                <CardTitle>Loans Overdue Today</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground text-sm">
                  Count: {report?.loans_overdue_today?.count}
                </p>
                <p className="text-xl font-bold text-yellow-600">
                  {report?.loans_overdue_today?.amount?.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* Journal Entry Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Journal Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground text-sm">
                  Inflow: {" "}
                  {report?.journal_summary?.inflow?.toLocaleString()}
                </p>
                <p className="text-foreground text-sm">
                  Outflow: {" "}
                  {report?.journal_summary?.outflow?.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default DailyReport;
