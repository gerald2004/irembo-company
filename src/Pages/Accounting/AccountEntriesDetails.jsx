/* eslint-disable react/prop-types */
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import {
  Table,
  TableBody,
  TableCell,
 
  TableRow,
} from "@/components/ui/table";
import { formatDateTimestamp } from "@/lib/utils";

import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Datatable from "../Components/Datatable";
import { Checkbox } from "@/components/ui/checkbox";

const AccountEntriesDetails = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const { accountId } = useParams();
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["account-entries-data", accountId],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `/accounting/journals/accounts/${accountId}`;
      try {
        const response = await axiosPrivate.get(fetchURL, {signal: controller.signal});
        // console.log(response?.data?.data.journal_entry);

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
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/chart-of-accounts">
              Chart Of Accounts
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{data?.account_title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <h5 className="mt-5 pt-5">Ledger Account Summary</h5>
          <TransactionTable transaction={data} />
          <h5 className="mt-5 pt-5">Ledger Account Details</h5>
          <AccountEntryDetailsTable
            data={data?.entries}
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

export default AccountEntriesDetails;

const TransactionTable = ({ transaction }) => {
  return (
    <div className="border rounded-md shadow-sm mt-5 overflow-x-auto">
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="font-semibold">Account Title</TableCell>
            <TableCell>{transaction?.account_title}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold">Account Code</TableCell>
            <TableCell>{transaction?.account_code}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold">Sub Group</TableCell>
            <TableCell>{transaction?.sub_group}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold">Category</TableCell>
            <TableCell>{transaction?.category}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold">Description</TableCell>
            <TableCell>{transaction?.description}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold">Total Debit</TableCell>
            <TableCell>{parseFloat(transaction?.total_debit)?.toLocaleString()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold">Total Credit</TableCell>
            <TableCell>{parseFloat(transaction?.total_credit)?.toLocaleString()}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

const AccountEntryDetailsTable = ({
  data,
  isLoading,
  refetch,
  isRefetching,
  isError,
}) => {
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
      cell: ({ row }) => <p>{row.original.code}</p>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <p>{row.original.description}</p>,
    },
    {
      accessorKey: "debit",
      header: "Debit",
      cell: ({ row }) => (
        <p>{parseFloat(row.original.debit).toLocaleString()}</p>
      ),
    },
    {
      accessorKey: "credit",
      header: "Credit",
      cell: ({ row }) => (
        <p>{parseFloat(row.original.credit).toLocaleString()}</p>
      ),
    },
    {
      accessorKey: "timestamp",
      header: "Timestamp",
      cell: ({ row }) => <p>{formatDateTimestamp(row.original.timestamp)}</p>,
    },
  ];
  return (
    <Datatable
        isLoading={isLoading}
        refetch={refetch}
        isRefetching={isRefetching}
        isError={isError}
        data={data}
        // colSpan={5}
        columns={columns}
      />
   
  );
};
