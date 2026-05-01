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
import { Link, useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";

const fmtMoney = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const GroupMembersReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: "" });

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["group-members-report", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/groups/members", {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            branch_id: filters.branch_id,
          },
        });
        return res?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401)
          navigate("/", { state: { from: location }, replace: true });
        throw error;
      }
    },
    placeholderData: (prev) => prev,
  });

  const columns = [
    {
      accessorKey: "group_name",
      header: "Group",
      cell: ({ row }) => (
        <Link to={`/clients/group/${row.original.group_id}`} className="text-xs capitalize font-medium">
          {row.original.group_name}
        </Link>
      ),
    },
    {
      accessorKey: "member_name",
      header: "Member Name",
      cell: ({ row }) => (
        <Link to={`/clients/individual/${row.original.member_id}`} className="text-xs capitalize">
          {row.original.member_name}
        </Link>
      ),
    },
    {
      accessorKey: "member_phone",
      header: "Phone",
      cell: ({ row }) => <p className="text-xs">{row.original.member_phone ?? "—"}</p>,
    },
    {
      accessorKey: "member_id_no",
      header: "ID No.",
      cell: ({ row }) => <p className="text-xs">{row.original.member_id_no ?? "—"}</p>,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant={row.original.role === "chairperson" ? "default" : "secondary"}>
          {row.original.role ?? "member"}
        </Badge>
      ),
    },
    {
      accessorKey: "joined_date",
      header: "Joined",
      cell: ({ row }) => (
        <p className="text-xs">{formatDateTimestamp(row.original.joined_date)}</p>
      ),
    },
    {
      accessorKey: "savings_balance",
      header: "Savings Balance",
      cell: ({ row }) => <p className="text-xs">{fmtMoney(row.original.savings_balance)}</p>,
    },
    {
      accessorKey: "active_loans",
      header: "Active Loans",
      cell: ({ row }) => <p className="text-xs text-center">{row.original.active_loans}</p>,
    },
    {
      accessorKey: "loan_balance",
      header: "Loan Balance",
      cell: ({ row }) => (
        <p className="text-xs font-medium">{fmtMoney(row.original.loan_balance)}</p>
      ),
    },
  ];

  const handleFilterChange = (f) => { setFilters(f); refetch(); };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/group-reports">Group Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Group Members</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <h5 className="text-2xl font-bold tracking-tight">Group Members Report</h5>
          <LoanGeneralReportQuery show={{ officer: false, group: true }}
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data}
            tableRef={tableRef}
            filters={filters}
            colSpan={3}
            mode={{ format: "A4-L", orientation: "L" }}
            totals={{}}
            title="Group Members Report"
          />
          <div className="max-w-[1200px]">
            <DatatableReport
              ref={tableRef}
              columns={columns}
              data={data ?? []}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              colSpan={9}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupMembersReport;
