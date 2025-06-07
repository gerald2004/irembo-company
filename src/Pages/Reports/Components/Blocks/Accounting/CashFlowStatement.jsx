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
import CashFlowStatementTable from "../../Tables/Accounting/CashFlowStatementTable";
import CustomReportQuery from "../Queries/CustomReportQuery";
import { useState } from "react";
const CashFlowStatement = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: "",
  });
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["cash-flow-statement", filters],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `reports/accounting/cash-flow`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
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
    keepPreviousData: true,
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
            <BreadcrumbLink to="/accounting-reports">
              Accounting Reports
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Cash Flow Statement</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Cash Flow Statament
            </h5>
          </div>

          <CustomReportQuery
            isRefetching={isRefetching}
            refetch={refetch}
            onFilterChange={handleFilterChange}
            data={data}
            filters={filters}
            colSpan={0}
            url={{
              pdf: "export/cash-flow/pdf",
              excel: "export/cash-flow/excel",
            }}
            mode={{
              format: "A4-P",
              orientation: "P",
            }}
            title={"Cash Flow Statement"}
          />
          <CashFlowStatementTable
            data={data}
            isLoading={isLoading}
            refetch={refetch}
            isRefetching={isRefetching}
            isError={isError}
          />
        </div>
      </div>
    </>
  );
};

export default CashFlowStatement;
