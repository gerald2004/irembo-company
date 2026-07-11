import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Datatable from "@/Pages/Components/Datatable";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import AlertModal from "@/components/AlertModal";
import { salaryAdvanceStatusBadge } from "./salaryAdvanceStatusBadge";
import ApproveSalaryAdvanceDialog from "./Components/Forms/ApproveSalaryAdvanceDialog";
import RejectSalaryAdvanceDialog from "./Components/Forms/RejectSalaryAdvanceDialog";
import SalaryAdvanceDisbursementDialog from "./Components/Forms/SalaryAdvanceDisbursementDialog";
import SalaryAdvanceRepaymentDialog from "./Components/Forms/SalaryAdvanceRepaymentDialog";

const SingleSalaryAdvance = () => {
  const navigate = useNavigate();
  const params = useParams();
  const axiosPrivate = useAxiosPrivate();
  const {
    auth: { roles },
  } = useAuth();

  const {
    data,
    isLoading,
    isRefetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["salary-advance-application", params.applicationid],
    queryFn: async () => {
      const controller = new AbortController();
      try {
        const response = await axiosPrivate.get(
          `/salary-advance/applications/${params.applicationid}`,
          { signal: controller.signal }
        );
        return response.data.data.salary_advance_application;
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    enabled: !!params.applicationid,
  });

  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDisburseDialog, setShowDisburseDialog] = useState(false);
  const [showWriteoffDialog, setShowWriteoffDialog] = useState(false);
  const [showRepayDialog, setShowRepayDialog] = useState(false);

  const runAction = async (fn, successMessage) => {
    try {
      const response = await fn();
      toast({ title: "Success", description: response?.data?.messages ?? successMessage });
      refetch();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage,
      });
    }
  };

  const handleWriteoff = () =>
    runAction(() =>
      axiosPrivate.patch(`/salary-advance/applications/${params.applicationid}/writeoff`, {})
    );

  const transactionColumns = [
    {
      accessorKey: "transaction_code",
      header: "Transaction Code",
    },
    {
      accessorKey: "transaction_type",
      header: "Type",
      cell: ({ row }) => <p className="capitalize">{row.original.transaction_type}</p>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <p>{Number(row.original.amount ?? 0).toLocaleString()}</p>,
    },
    {
      accessorKey: "narrative",
      header: "Narrative",
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) =>
        row.original.created_at
          ? new Date(row.original.created_at).toLocaleString()
          : "—",
    },
  ];

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/salary-advance-applications">
              Salary Advances
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{data?.code}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 pt-2">
          {isLoading || isRefetching ? (
            <Skeleton className="h-[400px] rounded-xl" />
          ) : isError ? (
            <Button onClick={() => refetch()}>Retry</Button>
          ) : (
            <>
              <Card className="shadow-lg rounded-xl">
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-xl font-semibold">
                        {data?.code}
                      </CardTitle>
                      <CardDescription>
                        {data?.user
                          ? `${data.user.firstname ?? ""} ${data.user.lastname ?? ""}`.trim()
                          : `Staff #${data?.user_id}`}
                      </CardDescription>
                    </div>
                    {salaryAdvanceStatusBadge(data?.status)}
                  </div>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <p>
                    Amount Requested:{" "}
                    <span className="font-semibold">
                      {Number(data?.amount_requested ?? 0).toLocaleString()}
                    </span>
                  </p>
                  <p>
                    Fee Amount:{" "}
                    <span className="font-semibold">
                      {Number(data?.fee_amount ?? 0).toLocaleString()}
                    </span>
                  </p>
                  <p>
                    Outstanding Balance:{" "}
                    <span className="font-semibold">
                      {Number(data?.outstanding_balance ?? 0).toLocaleString()}
                    </span>
                  </p>
                  {data?.amount_disbursed != null && (
                    <p>
                      Amount Disbursed:{" "}
                      <span className="font-semibold">
                        {Number(data.amount_disbursed).toLocaleString()}
                      </span>
                    </p>
                  )}
                  <p>
                    Narration:{" "}
                    <span className="font-semibold">{data?.narration || "—"}</span>
                  </p>
                  {data?.approval_notes && (
                    <p className="md:col-span-2">
                      Approval Notes:{" "}
                      <span className="font-semibold">{data.approval_notes}</span>
                    </p>
                  )}
                  {data?.status === "rejected" && (
                    <p className="md:col-span-2">
                      Rejection Reason:{" "}
                      <span className="font-semibold">{data?.rejection_reason}</span>
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {data?.status === "pending" && hasPermission(roles, 100623) && (
                  <Button size="sm" onClick={() => setShowApproveDialog(true)}>
                    Approve
                  </Button>
                )}
                {data?.status === "pending" && hasPermission(roles, 100624) && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    Reject
                  </Button>
                )}
                {data?.status === "approved" && hasPermission(roles, 100625) && (
                  <Button size="sm" onClick={() => setShowDisburseDialog(true)}>
                    Disburse
                  </Button>
                )}
                {data?.status === "disbursed" && hasPermission(roles, 100626) && (
                  <Button size="sm" onClick={() => setShowRepayDialog(true)}>
                    Record Repayment
                  </Button>
                )}
                {data?.status === "disbursed" &&
                  Number(data?.outstanding_balance ?? 0) > 0 &&
                  hasPermission(roles, 100627) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setShowWriteoffDialog(true)}
                    >
                      Write Off
                    </Button>
                  )}
              </div>

              {/* Transactions */}
              <Card className="shadow-lg rounded-xl">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg font-semibold">
                    Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <Datatable
                    columns={transactionColumns}
                    data={data?.transactions ?? []}
                    fetchData={refetch}
                    isLoading={false}
                    isRefetching={false}
                    isError={false}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      <ApproveSalaryAdvanceDialog
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        refetch={refetch}
        applicationId={params.applicationid}
      />

      <RejectSalaryAdvanceDialog
        isOpen={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        refetch={refetch}
        applicationId={params.applicationid}
      />

      <SalaryAdvanceDisbursementDialog
        isOpen={showDisburseDialog}
        onClose={() => setShowDisburseDialog(false)}
        refetch={refetch}
        applicationId={params.applicationid}
        amountRequested={data?.amount_requested}
      />

      <SalaryAdvanceRepaymentDialog
        isOpen={showRepayDialog}
        onClose={() => setShowRepayDialog(false)}
        refetch={refetch}
        applicationId={params.applicationid}
        outstandingBalance={data?.outstanding_balance}
      />

      <AlertModal
        showDialog={showWriteoffDialog}
        setShowDialog={setShowWriteoffDialog}
        title="Write off this salary advance?"
        message="This will write off the remaining outstanding balance. This cannot be undone."
        method={() => {
          handleWriteoff();
          setShowWriteoffDialog(false);
        }}
        buttonName="Write Off"
      />
    </>
  );
};

export default SingleSalaryAdvance;
