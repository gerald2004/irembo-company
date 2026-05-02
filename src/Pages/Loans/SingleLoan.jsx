import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoanSummary from "./Components/LoanSummary";
import { LoanScheduleTable } from "./Components/Tables/LoanScheduleTable";
import { LoanTransactionTable } from "./Components/Tables/LoanTransactionTable";
import { LoanHistory } from "./Components/Tables/LoanHistory";
import { LoanColletralTable } from "./Components/Tables/LoanColletralTable";
import LoanDocuments from "./Components/Blocks/LoanDocuments";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { LoanGuarantorsTable } from "./Components/Tables/LoanGuarantorsTable";
import { LoanFeesTable } from "./Components/Tables/LoanFeesTable";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";
import LoanIntelligenceDashboard from "./Components/Blocks/LoanIntelligenceDashboard";
import GroupLoanAllocations from "./Components/Tables/GroupLoanAllocations";
import LoanStatement from "./Components/Blocks/LoanStatement";

const SingleLoan = () => {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const params = useParams();

  const {
    data = [],
    refetch,
    isLoading,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["loan-application-data", params.loanid],
    queryFn: async () => {
      const controller = new AbortController();

      const fetchURL = `/loans/applications/${params.loanid}`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        if (!response.data.data) {
          throw new Error(response?.data?.message);
        }
        return response.data.data.loan_applications;
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw new Error(error?.response?.data?.message);
      }
    },
  });
  const [isModalOpen, setIsModalOpen] = useState();
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const {
    auth: { roles },
  } = useAuth();
  const status = data?.loan_application?.loan_application_status;

  // Determine the default tab dynamically
  let defaultTab = "summary"; // fallback

  if (
    ["disbursed", "settled", "writtenoff", "paid_off", "refinanced"].includes(
      status
    ) &&
    hasPermission(roles, 100160)
  ) {
    defaultTab = "schedule";
  } else if (
    ["disbursed", "settled", "writtenoff", "paid_off", "refinanced"].includes(
      status
    ) &&
    hasPermission(roles, 100161)
  ) {
    defaultTab = "loan-transactions";
  } else if (hasPermission(roles, 100159)) {
    defaultTab = "summary";
  } else if (hasPermission(roles, 100162)) {
    defaultTab = "history";
  } else if (hasPermission(roles, 100163)) {
    defaultTab = "colletral";
  } else if (hasPermission(roles, 100164)) {
    defaultTab = "documents";
  } else if (hasPermission(roles, 100165)) {
    defaultTab = "guarantors";
  } else if (status === "disbursed" && hasPermission(roles, 100166)) {
    defaultTab = "loan-fees";
  }
  
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/individual-loans">Loans</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              to={
                data?.loan_application?.client?.client_type === "individual"
                  ? `/clients/individual/${data?.loan_application?.client?.client_id}`
                  : `/clients/group/${data?.loan_application?.client?.client_id}`
              }
            >
              {data?.loan_application?.client?.client_type === "individual"
                ? `${data?.loan_application?.client?.client_firstname} ${data?.loan_application?.client?.client_middlename} ${data?.loan_application?.client?.client_lastname} (${data?.loan_application?.client?.client_account_number})`
                : `${data?.loan_application?.client?.client_group_name} (${data?.loan_application?.client?.client_account_number})`}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              <p className="capitalize hover:uppercase">
                {`${data?.loan_application?.loan_application_code}`}
              </p>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 pt-2">
          <Tabs defaultValue={defaultTab} className="space-y-4">
            <div className="flex justify-end">
              <TabsList className="overflow-x-auto scroll-smooth snap-x snap-start scrollbar-hide">
                {hasPermission(roles, 100159) && (
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                )}
                {[
                  "disbursed",
                  "settled",
                  "writternoff",
                  "paid_off",
                  "refinanced",
                ].includes(data?.loan_application?.loan_application_status) && (
                  <>
                    {hasPermission(roles, 100160) && (
                      <TabsTrigger value="schedule">Loan Schedule</TabsTrigger>
                    )}
                    {hasPermission(roles, 100161) && (
                      <TabsTrigger value="loan-transactions">
                        Transactions
                      </TabsTrigger>
                    )}
                    {hasPermission(roles, 100161) && (
                      <TabsTrigger value="loan-intelligence">
                        Loan Intelligence
                      </TabsTrigger>
                    )}
                  </>
                )}

                {hasPermission(roles, 100162) && (
                  <TabsTrigger value="history">Loan History</TabsTrigger>
                )}
                {hasPermission(roles, 100163) && (
                  <TabsTrigger value="colletral">
                    Colletral Sercuity
                  </TabsTrigger>
                )}
                {hasPermission(roles, 100164) && (
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                )}
                {hasPermission(roles, 100165) && (
                  <TabsTrigger value="guarantors">Guarantors</TabsTrigger>
                )}
                {data?.loan_application?.loan_application_status ===
                  "disbursed" &&
                  hasPermission(roles, 100166) && (
                    <TabsTrigger value="loan-fees">Loan Fees</TabsTrigger>
                  )}
                {data?.loan_application?.client?.client_type === "group" && (
                  <TabsTrigger value="group-allocations">
                    Member Allocations
                  </TabsTrigger>
                )}
                {["disbursed", "settled", "writternoff", "paid_off", "refinanced"].includes(
                  data?.loan_application?.loan_application_status
                ) && hasPermission(roles, 100161) && (
                  <TabsTrigger value="loan-statement">Statement</TabsTrigger>
                )}
              </TabsList>
            </div>
            <TabsContent value="summary" className="space-y-4">
              {hasPermission(roles, 100159) && (
                <LoanSummary
                  data={data?.loan_application}
                  totals={data?.totals}
                  refetch={refetch}
                />
              )}
            </TabsContent>
            <TabsContent value="loan-intelligence" className="space-y-4">
              {hasPermission(roles, 100159) && (
                <LoanIntelligenceDashboard
                  loanId={params.loanid}
                  refetch={refetch}
                />
              )}
            </TabsContent>
            <TabsContent value="schedule" className="space-y-4">
              {hasPermission(roles, 100160) && (
                <LoanScheduleTable
                  data={data?.loan_application?.loan_schedule}
                  loanStatus={data?.loan_application?.loan_application_status}
                  refetch={refetch}
                  isLoading={isLoading}
                  isRefetching={isRefetching}
                  isError={isError}
                  loansData={data?.loan_application}
                  totals={data?.totals}
                />
              )}
            </TabsContent>
            <TabsContent value="loan-transactions" className="space-y-4">
              {hasPermission(roles, 100161) && (
                <LoanTransactionTable
                  data={data?.loan_application?.loan_transactions}
                  loanStatus={data?.loan_application?.loan_application_status}
                  refetch={refetch}
                  isLoading={isLoading}
                  isRefetching={isRefetching}
                  isError={isError}
                />
              )}
            </TabsContent>
            <TabsContent value="history" className="space-y-4">
              {hasPermission(roles, 100162) && (
                <LoanHistory
                  data={data?.loan_application?.loan_history}
                  loanStatus={data?.loan_application?.loan_application_status}
                  refetch={refetch}
                  isLoading={isLoading}
                  isRefetching={isRefetching}
                  isError={isError}
                />
              )}
            </TabsContent>
            <TabsContent value="colletral" className="space-y-4">
              {hasPermission(roles, 100163) && <LoanColletralTable />}
            </TabsContent>
            <TabsContent value="documents" className="space-y-4">
              <div className="max-w-5xl mx-auto p-5 space-y-8">
                {hasPermission(roles, 100089) && (
                  <Button
                    size="sm"
                    onClick={handleOpenModal}
                    className="float-end"
                  >
                    Add Document
                  </Button>
                )}
                {hasPermission(roles, 100164) && (
                  <LoanDocuments
                    isOpen={isModalOpen}
                    isClose={handleCloseModal}
                  />
                )}
              </div>
            </TabsContent>
            <TabsContent value="guarantors" className="space-y-4">
              {hasPermission(roles, 100165) && <LoanGuarantorsTable />}
            </TabsContent>
            <TabsContent value="loan-fees" className="space-y-4">
              {hasPermission(roles, 100166) && <LoanFeesTable />}
            </TabsContent>
            <TabsContent value="group-allocations" className="space-y-4">
              {data?.loan_application?.client?.client_type === "group" && (
                <GroupLoanAllocations />
              )}
            </TabsContent>
            <TabsContent value="loan-statement" className="space-y-4">
              {hasPermission(roles, 100161) && (
                <LoanStatement loanId={params.loanid} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default SingleLoan;
