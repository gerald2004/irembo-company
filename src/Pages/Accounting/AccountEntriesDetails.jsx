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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTimestamp } from "@/lib/utils";

import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Datatable from "../Components/Datatable";
import { Checkbox } from "@/components/ui/checkbox";

const MODULE_LABELS = {
  manual:         "Manual",
  deposit:        "Deposit",
  withdrawal:     "Withdrawal",
  transfer:       "Transfer",
  loan:           "Loan",
  income:         "Income",
  expense:        "Expense",
  shares:         "Shares",
  "fixed-deposit":"Fixed Deposit",
  "inter-branch": "Inter-Branch",
  general:        "General",
};

function ModuleBadge({ module }) {
  const label = MODULE_LABELS[module] ?? module ?? "General";
  return (
    <Badge variant="outline" className="text-xs capitalize font-normal">
      {label}
    </Badge>
  );
}

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
        const response = await axiosPrivate.get(fetchURL, { signal: controller.signal });
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
          <SummaryTable transaction={data} />
          <h5 className="mt-5 pt-5">Ledger Account Entries</h5>
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

const SummaryTable = ({ transaction }) => {
  const balance = parseFloat(transaction?.balance ?? 0);
  return (
    <div className="border rounded-md shadow-sm mt-5 overflow-x-auto">
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="font-semibold w-40">Account Title</TableCell>
            <TableCell>{transaction?.account_title}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold">Account Code</TableCell>
            <TableCell className="font-mono">{transaction?.account_code}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold">Sub Group</TableCell>
            <TableCell>{transaction?.sub_group}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold">Category</TableCell>
            <TableCell>{transaction?.category}</TableCell>
          </TableRow>
          {transaction?.account_description && (
            <TableRow>
              <TableCell className="font-semibold">Description</TableCell>
              <TableCell>{transaction.account_description}</TableCell>
            </TableRow>
          )}
          <TableRow>
            <TableCell className="font-semibold">Total Debit</TableCell>
            <TableCell className="text-blue-600 font-mono">
              {parseFloat(transaction?.total_debit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold">Total Credit</TableCell>
            <TableCell className="text-green-600 font-mono">
              {parseFloat(transaction?.total_credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold">Balance</TableCell>
            <TableCell className={`font-mono font-semibold ${balance >= 0 ? "text-blue-700" : "text-red-600"}`}>
              {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </TableCell>
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
      id: "transaction_date",
      header: "Date",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs">
          {formatDateTimestamp(row.original.transaction_date ?? row.original.posted_at)}
        </span>
      ),
    },
    {
      id: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.code ?? "—"}</span>
      ),
    },
    {
      id: "source_module",
      header: "Module",
      cell: ({ row }) => <ModuleBadge module={row.original.source_module} />,
    },
    {
      id: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.description ?? "—"}</span>
      ),
    },
    {
      id: "memo",
      header: "Memo",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.memo || "—"}</span>
      ),
    },
    {
      id: "debit",
      header: "Debit",
      cell: ({ row }) => {
        const v = parseFloat(row.original.debit);
        return v > 0 ? (
          <span className="text-blue-600 font-mono text-sm">
            {v.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "credit",
      header: "Credit",
      cell: ({ row }) => {
        const v = parseFloat(row.original.credit);
        return v > 0 ? (
          <span className="text-green-600 font-mono text-sm">
            {v.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "running_balance",
      header: "Balance",
      cell: ({ row }) => {
        const v = row.original.running_balance;
        if (v == null) return <span className="text-muted-foreground">—</span>;
        const n = parseFloat(v);
        return (
          <span className={`font-mono text-sm ${n >= 0 ? "" : "text-red-600"}`}>
            {n.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
  ];

  return (
    <Datatable
      isLoading={isLoading}
      refetch={refetch}
      isRefetching={isRefetching}
      isError={isError}
      data={data}
      columns={columns}
    />
  );
};
