/* eslint-disable react/prop-types */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, Clock, AlertTriangle, X } from "lucide-react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { useBranches } from "@/Queries/Settings/branches";
import { IndividualLoansApplicationsTable } from "./Components/Tables/IndividualLoanApplicationsTable";
import { IndividualLoanActiveTable } from "./Components/Tables/IndividualLoanActiveTable";
import { IndividualLoanOverdueTable } from "./Components/Tables/IndividualLoanOverdueTable";

const StatCard = ({ label, count, color = "slate" }) => {
  const colors = {
    slate:  "bg-slate-50 border-slate-200 text-slate-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    red:    "bg-red-50 border-red-200 text-red-700",
  };
  return (
    <div className={`rounded-lg border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold">
        {count === undefined ? "—" : count.toLocaleString()}
      </p>
    </div>
  );
};

const IndividualLoans = () => {
  const axiosPrivate = useAxiosPrivate();
  const { auth: { user } } = useAuth();
  const privilege = String(user?.data_privilege || "branch").toLowerCase();
  const isSaccoUser  = privilege === "sacco";
  const isBranchUser = privilege === "branch";

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [extraFilters, setExtraFilters] = useState({});

  const { data: branches = [] } = useBranches();

  const { data: loanProducts = [] } = useQuery({
    queryKey: ["loan-products"],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("/settings/loans/products");
        return res?.data?.data?.loan_products ?? [];
      } catch {
        return [];
      }
    },
  });

  // Fetch officers; for sacco users filter by selected branch if one is picked
  const officerBranchId = isSaccoUser ? selectedBranch : null;
  const { data: officers = [] } = useQuery({
    queryKey: ["loan-officers", officerBranchId],
    queryFn: async () => {
      try {
        const params = officerBranchId ? { branch_id: officerBranchId } : {};
        const res = await axiosPrivate.get("/sacco/users", { params });
        const users = res?.data?.data?.users ?? [];
        return users;
      } catch {
        return [];
      }
    },
  });

  const buildParams = (endpoint, extra = {}) => ({
    start: 0,
    size: 1,
    type: "individual",
    ...extraFilters,
    ...extra,
  });

  const { data: applicationsCount } = useQuery({
    queryKey: ["individual-loans-count-applications", extraFilters],
    queryFn: async () => {
      const res = await axiosPrivate.get("/serverside/loan-applications", { params: buildParams() });
      return res.data.data?.meta?.totalRowCount ?? 0;
    },
  });

  const { data: activeCount } = useQuery({
    queryKey: ["individual-loans-count-active", extraFilters],
    queryFn: async () => {
      const res = await axiosPrivate.get("/serverside/active-loans", { params: buildParams() });
      return res.data.data?.meta?.totalRowCount ?? 0;
    },
  });

  const { data: dueTodayCount } = useQuery({
    queryKey: ["individual-loans-count-due-today", extraFilters],
    queryFn: async () => {
      const res = await axiosPrivate.get("/serverside/active-loans", { params: buildParams({}, { due_today: 1 }) });
      return res.data.data?.meta?.totalRowCount ?? 0;
    },
  });

  const { data: overdueCount } = useQuery({
    queryKey: ["individual-loans-count-overdue", extraFilters],
    queryFn: async () => {
      const res = await axiosPrivate.get("/serverside/overdue-loans", { params: buildParams() });
      return res.data.data?.meta?.totalRowCount ?? 0;
    },
  });

  const applyFilters = () => {
    const f = {};
    if (selectedProduct) f.loan_product_id = selectedProduct;
    if (selectedBranch)  f.branch_id = selectedBranch;
    if (selectedOfficer) f.user_id   = selectedOfficer;
    setExtraFilters(f);
  };

  const clearFilters = () => {
    setSelectedProduct("");
    setSelectedBranch("");
    setSelectedOfficer("");
    setExtraFilters({});
  };

  const hasActiveFilters = Object.keys(extraFilters).length > 0;

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Individual Loans</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between">
            <h5 className="text-2xl font-bold tracking-tight">Individual Loans</h5>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-48 bg-background">
                <SelectValue placeholder="All loan products" />
              </SelectTrigger>
              <SelectContent>
                {loanProducts.map((p) => (
                  <SelectItem key={p.loan_product_id ?? p.id} value={String(p.loan_product_id ?? p.id)}>
                    {p.loan_product_title ?? p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isSaccoUser && (
              <Select value={selectedBranch} onValueChange={(v) => { setSelectedBranch(v); setSelectedOfficer(""); }}>
                <SelectTrigger className="w-44 bg-background">
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.branch_id} value={String(b.branch_id)}>
                      {b.branch_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(isSaccoUser || isBranchUser) && officers.length > 0 && (
              <Select value={selectedOfficer} onValueChange={setSelectedOfficer}>
                <SelectTrigger className="w-48 bg-background">
                  <SelectValue placeholder="All officers" />
                </SelectTrigger>
                <SelectContent>
                  {officers.map((o) => (
                    <SelectItem key={o.id ?? o.user_id} value={String(o.id ?? o.user_id)}>
                      {(o.firstname ?? o.user_firstname ?? "")} {(o.lastname ?? o.user_lastname ?? "")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button size="sm" onClick={applyFilters}>Apply</Button>
            {hasActiveFilters && (
              <Button size="sm" variant="ghost" onClick={clearFilters} className="gap-1 text-muted-foreground">
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Applications" count={applicationsCount} color="slate" />
            <StatCard label="Active Loans" count={activeCount} color="emerald" />
            <StatCard label="Due Today" count={dueTodayCount} color="orange" />
            <StatCard label="Overdue" count={overdueCount} color="red" />
          </div>

          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="applications" className="gap-1.5">
                <FileText className="h-4 w-4" />
                Applications
                {applicationsCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-[10px]">{applicationsCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active" className="gap-1.5">
                <TrendingUp className="h-4 w-4" />
                Active
                {activeCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-[10px]">{activeCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="due_today" className="gap-1.5">
                <Clock className="h-4 w-4" />
                Due Today
                {dueTodayCount > 0 && (
                  <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px] bg-orange-500 hover:bg-orange-500">{dueTodayCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="overdue" className="gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Overdue
                {overdueCount > 0 && (
                  <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px] bg-red-500 hover:bg-red-500">{overdueCount}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="applications" className="space-y-4">
              <IndividualLoansApplicationsTable
                clientType="individual"
                queryKeyPrefix="individual"
                clientRoute="/clients/individual"
                extraFilters={extraFilters}
              />
            </TabsContent>
            <TabsContent value="active" className="space-y-4">
              <IndividualLoanActiveTable
                clientType="individual"
                queryKeyPrefix="individual"
                clientRoute="/clients/individual"
                extraFilters={extraFilters}
              />
            </TabsContent>
            <TabsContent value="due_today" className="space-y-4">
              <IndividualLoanActiveTable
                clientType="individual"
                queryKeyPrefix="individual-due-today"
                clientRoute="/clients/individual"
                dueToday={true}
                extraFilters={extraFilters}
              />
            </TabsContent>
            <TabsContent value="overdue" className="space-y-4">
              <IndividualLoanOverdueTable
                clientType="individual"
                queryKeyPrefix="individual"
                clientRoute="/clients/individual"
                extraFilters={extraFilters}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default IndividualLoans;
