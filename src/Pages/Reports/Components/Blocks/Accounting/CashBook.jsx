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
import CashbookTable from "../../Tables/Accounting/CashbookTable";
import { useState } from "react";
import CustomReportQuery from "../Queries/CustomReportQuery";

const CashBook = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: "",
  });
  const {
    data = [],
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["cashbook", filters],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `reports/accounting/cashbook`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            branch_id: filters.branch_id,
          },
          signal: controller.signal,
        });
        // console.log(response.data.data);
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
            <BreadcrumbPage>Cashbook</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">Cashbook</h5>
          </div>
          <CustomReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            url={{ pdf: "export/cash-book/pdf", excel: "export/cash-book/excel" }}
            data={{ cash: data?.cash ?? [], bank: data?.bank ?? []}}
            filters={filters}
            colSpan={2}
            mode={{
              format: "A4-L",
              orientation: "L",
            }}
            totals={{
              cash_in: data?.totals?.cash_in,
              cash_out: data?.totals?.cash_out,
              bank_in: data?.totals?.bank_in,
              bank_out: data?.totals?.bank_out,
              cash_opening: data?.totals?.cash_opening,
              cash_closing: data?.totals?.cash_closing,
              bank_opening: data?.totals?.bank_opening,
              bank_closing: data?.totals?.bank_closing,
            }}
            title={`Cash Book`}
          />
          <CashbookTable data={data} />
        </div>
      </div>
    </>
  );
};

export default CashBook;
