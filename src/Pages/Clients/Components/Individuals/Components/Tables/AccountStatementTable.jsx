import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Datatable from "@/Pages/Components/Datatable";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  formatDateTimestamp,
  getValidDate,
  hasPermission,
  prepareDataForExport,
} from "@/lib/utils";
import ClientStatementQuery from "../Queries/ClientStatementQuery";
import { toast } from "@/hooks/use-toast";
import fileDownload from "js-file-download";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import ReverseStatementTransaction from "../Forms/ReverseStatementTransaction";

const AccountStatementTable = () => {
  const { client_id: clientAccountId } = useParams(); // ✅ Get client_account_id from URL
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null); // ✅ Reference for the table

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
  });
  const { auth } = useAuth();
  const roles = auth?.roles;
  // ✅ Fetch Transactions for the Account
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["transactions", clientAccountId, filters],
    queryFn: async () => {
      const controller = new AbortController();

      const fetchURL = `/clients/accounts/statement/${clientAccountId}`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
          },
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
  const [transactionId, setTransactionId] = useState([]);
  const [openModal, setOpenModal] = useState(false);

  const handleReverseTransactionOpen = (data) => {
    setOpenModal(true);
    setTransactionId(data);
  };

  const handleReverseTransactionClose = () => {
    setOpenModal(false);
    setTransactionId([]);
  };

  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    },
    {
      accessorKey: "transaction_code",
      header: "Transaction Code",
      cell: ({ row }) => <p>{row.original.transaction_code}</p>,
    },
    {
      accessorKey: "transaction_type",
      header: "Transaction Type",
      cell: ({ row }) => (
        <p className="capitalize">{row.original.transaction_type}</p>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <p>{row.original.description}</p>,
    },
    {
      accessorKey: "debit_amount",
      header: "Debit",
      cell: ({ row }) =>
        row.original.debit_credit === "Debit" ? (
          <p>{parseFloat(row.original.amount).toLocaleString()}</p>
        ) : (
          "-"
        ),
    },
    {
      accessorKey: "credit_amount",
      header: "Credit",
      cell: ({ row }) =>
        row.original.debit_credit === "Credit" ? (
          <p>{parseFloat(row.original.amount).toLocaleString()}</p>
        ) : (
          "-"
        ),
    },
    {
      accessorKey: "running_balance",
      header: "Running Balance",
      cell: ({ row }) => (
        <p>{parseFloat(row.original.running_balance).toLocaleString()}</p>
      ),
    },
    {
      accessorKey: "transaction_date",
      header: "Date",
      cell: ({ row }) => formatDateTimestamp(row.original.transaction_date),
    },

    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              ...
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {hasPermission(roles, 100041) && (
              <DropdownMenuItem
                onClick={() =>
                  handleReverseTransactionOpen(row.original.statement_id)
                }
              >
                Reverse Transaction
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const [isDownloading, setIsDownloading] = useState(false);

  const onDownload = async (type) => {
    if (!tableRef.current) {
      toast({
        title: "Table not ready",
        variant: "destructive",
        description: "Cannot find the table instance.",
      });
      return;
    }

    const exportData = prepareDataForExport(tableRef.current, data);
    const controller = new AbortController();

    const dataDownload = {
      transactions: exportData,
      clientData: { client_account_id: clientAccountId },
      dates: {
        start_date: formatDateTimestamp(
          getValidDate(filters.startDate, auth?.fiscalYear?.start_date)
        ),
        end_date: formatDateTimestamp(
          getValidDate(filters.endDate, new Date())
        ),
      },
    };

    try {
      setIsDownloading(true);
      let response;
      if (type === "pdf") {
        response = await axiosPrivate.post(
          `/export/account-statement/pdf`, // <-- Your endpoint
          { data: dataDownload },
          {
            responseType: "blob",
            signal: controller.signal,
          }
        );
      }

      if (type === "xlsx") {
        response = await axiosPrivate.post(
          `/export/account-statement/excel`, // <-- Your endpoint
          { data: dataDownload },
          {
            responseType: "blob",
            signal: controller.signal,
          }
        );
      }

      const unix = Math.round(+new Date() / 1000);
      const fileType = type === "pdf" ? "pdf" : "xlsx";
      const downloadTitle = `Account-Statement-${unix}.${fileType}`;

      fileDownload(response.data, downloadTitle);

      toast({
        title: `Download successful`,
        variant: "success",
        description: `Your ${fileType.toUpperCase()} file has been downloaded.`,
      });
      setIsDownloading(false);
    } catch (error) {
      console.log(error);
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: "Failed to download file.",
      });
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ✅ Filters */}
      <div className="flex items-center justify-center space-x-2">
        {hasPermission(roles, 100050) && (
          <ClientStatementQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
          />
        )}
        {hasPermission(roles, 100157) && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDownload("pdf")}
              disabled={isDownloading}
            >
              Export PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDownload("xlsx")}
              disabled={isDownloading}
            >
              Export Excel
            </Button>
          </>
        )}
      </div>

      {/* ✅ Transaction Table */}
      <Datatable
        ref={tableRef}
        columns={columns}
        data={data}
        fetchData={refetch}
        isLoading={isLoading}
        isRefetching={isRefetching}
        isError={isError}
        colSpan={5}
      />
      {openModal && (
        <ReverseStatementTransaction
          transactionId={transactionId}
          isOpen={openModal}
          refetch={refetch}
          onClose={handleReverseTransactionClose}
        />
      )}
    </div>
  );
};

export default AccountStatementTable;
