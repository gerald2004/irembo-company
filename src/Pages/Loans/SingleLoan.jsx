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
          <Tabs defaultValue="summary" className="space-y-4">
            <div className="flex justify-end">
              <TabsList className="overflow-x-auto scroll-smooth snap-x snap-start scrollbar-hide">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                {data?.loan_application?.loan_application_status !==
                  "pending" &&
                  data?.loan_application?.loan_application_status !==
                    "approved" &&
                  data?.loan_application?.loan_application_status !==
                    "processed" && (
                    <>
                      <TabsTrigger value="schedule">Loan Schedule</TabsTrigger>
                      <TabsTrigger value="loan-transactions">
                        Transactions
                      </TabsTrigger>
                    </>
                  )}

                <TabsTrigger value="history">Loan History</TabsTrigger>
                <TabsTrigger value="colletral">Colletral Sercuity</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="guarantors">Guarantors</TabsTrigger>
                {data?.loan_application?.loan_application_status !==
                  "pending" &&
                  data?.loan_application?.loan_application_status !==
                    "approved" &&
                  data?.loan_application?.loan_application_status !==
                    "processed" && (
                    <TabsTrigger value="loan-fees">Loan Fees</TabsTrigger>
                  )}
              </TabsList>
            </div>
            <TabsContent value="summary" className="space-y-4">
              <LoanSummary
                data={data?.loan_application}
                totals={data?.totals}
                refetch={refetch}
              />
            </TabsContent>
            <TabsContent value="schedule" className="space-y-4">
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
            </TabsContent>
            <TabsContent value="loan-transactions" className="space-y-4">
              <LoanTransactionTable
                data={data?.loan_application?.loan_transactions}
                loanStatus={data?.loan_application?.loan_application_status}
                refetch={refetch}
                isLoading={isLoading}
                isRefetching={isRefetching}
                isError={isError}
              />
            </TabsContent>
            <TabsContent value="history" className="space-y-4">
              <LoanHistory
                data={data?.loan_application?.loan_history}
                loanStatus={data?.loan_application?.loan_application_status}
                refetch={refetch}
                isLoading={isLoading}
                isRefetching={isRefetching}
                isError={isError}
              />
            </TabsContent>
            <TabsContent value="colletral" className="space-y-4">
              <LoanColletralTable />
            </TabsContent>
            <TabsContent value="documents" className="space-y-4">
              <div className="max-w-5xl mx-auto p-5 space-y-8">
                <Button
                  size="sm"
                  onClick={handleOpenModal}
                  className="float-end"
                >
                  Add Document
                </Button>
                <LoanDocuments
                  isOpen={isModalOpen}
                  isClose={handleCloseModal}
                />
              </div>
            </TabsContent>
            <TabsContent value="guarantors" className="space-y-4">
              <LoanGuarantorsTable />
            </TabsContent>
            <TabsContent value="loan-fees" className="space-y-4">
              <LoanFeesTable />{" "}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default SingleLoan;
