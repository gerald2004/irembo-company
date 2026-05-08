import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef } from "react";

const MembershipReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: String(branchKey ?? ""),
    user_id: "",
  });
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["membership-reports", filters],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `reports/clients/members`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          params: {
            startDate:     filters.startDate,
            endDate:       filters.endDate,
            branch_id:     filters.branch_id,
            client_status: filters.client_status,
            client_type:   filters.client_type,
            gender:        filters.gender,
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
    placeholderData: (prev) => prev,
  });

  const columns = [
    {
      accessorKey: "account",
      header: "Account Number",
      cell: ({ row }) => (
        <Link
          to={`/clients/${
            row.original.client_type === "individual" ? "individual" : "group"
          }/${row.original.client_id}`}
          className="capitalize text-xs"
        >
          {" "}
          {row.original.account}
        </Link>
      ),
    },
    {
      accessorKey: "name",
      header: "Client Name",
      cell: ({ row }) => (
        <Link
          to={`/clients/${
            row.original.client_type === "individual" ? "individual" : "group"
          }/${row.original.client_id}`}
          className="capitalize text-xs"
        >
          {" "}
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.contact}</p>
      ),
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {row.original.gender === null ? "Group" : row.original.gender}
        </p>
      ),
    },

    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className="capitalize text-xs">{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: "id_number",
      header: "Id",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.id_number}</p>
      ),
    },
    {
      accessorKey: "dob",
      header: "D.O.B",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {formatDateTimestamp(row.original.dob) ?? "N/A"}
        </p>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.email ?? "N/A"}</p>
      ),
    },
    {
      accessorKey: "join_date",
      header: "Join Date",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {formatDateTimestamp(row.original.join_date)}
        </p>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Timestamp",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {formatDateTimestamp(row.original.created_at)}
        </p>
      ),
    },
    {
      accessorKey: "registered_by",
      header: "Created By",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.registered_by}</p>
      ),
    },
    {
      accessorKey: "branch",
      header: "Branch",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row?.original.branch}</p>
      ),
    },
  ];
  const handleFilterChange = (data) => {
    setFilters(data);
    refetch();
  };

  const fmt = (n) => new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(n ?? 0);

  const KPI = ({ label, value, sub, accent = "bg-blue-500" }) => (
    <div className={`rounded-xl border bg-card shadow-sm overflow-hidden`}>
      <div className={`h-1 ${accent}`} />
      <div className="p-4">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/client-reports">Client Reports</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Membership Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Membership Report
            </h5>
          </div>
          <LoanGeneralReportQuery show={{ officer: false, clientStatus: true, clientType: true, gender: true }}
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data}
            tableRef={tableRef}
            filters={filters}
            colSpan={3}
            mode={{
              format: "A4-L",
              orientation: "L",
            }}
            title={"Membership Report"}
          />
          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label="Total Members" value={data?.length ?? 0} sub="In selected period/branch" accent="bg-blue-500" />
            <KPI label="Active" value={data?.filter(m=>(m.status??'').toLowerCase()==='active').length ?? 0} sub="Active members" accent="bg-emerald-500" />
            <KPI label="Inactive" value={data?.filter(m=>(m.status??'').toLowerCase()==='inactive').length ?? 0} sub="Inactive members" accent="bg-amber-500" />
            <KPI label="Individual" value={data?.filter(m=>(m.client_type??'').toLowerCase()==='individual').length ?? 0} sub={`${data?.filter(m=>(m.client_type??'').toLowerCase()==='group').length ?? 0} groups`} accent="bg-violet-500" />
          </div>
          <div className="overflow-x-auto max-w-[1200px]">
            <DatatableReport
              ref={tableRef}
              columns={columns}
              data={data ?? []}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default MembershipReport;
