/* eslint-disable react/prop-types */
import { Badge } from "@/components/ui/badge";
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
import { formatDateTimestamp } from "@/lib/utils";

import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
const JournalEntriesDetails = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const { journalId } = useParams();

  const { data = [] } = useQuery({
    queryKey: ["journal-entries-data", journalId],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `/accounting/journals/${journalId}`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
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
            <BreadcrumbLink to="/journal-entries">
              Journal Entries
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {data?.journal_entry?.transaction_code}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <h5 className="mt-5 pt-5">Journal Summary</h5>
          <TransactionTable transaction={data?.journal_entry} />
          <h5 className="mt-5 pt-5">Journal Details</h5>
          <JournalEntryDetailsTable data={data?.lines} />
        </div>
      </div>
    </>
  );
};

export default JournalEntriesDetails;

const TransactionTable = ({ transaction }) => {
  return (
    <div className="border rounded-md shadow-sm mt-5 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              {formatDateTimestamp(transaction?.transaction_date)}
            </TableCell>
            <TableCell>{transaction?.transaction_code}</TableCell>
            <TableCell>{transaction?.description}</TableCell>
            <TableCell className="text-right font-medium">
              {parseFloat(transaction?.amount)?.toLocaleString()}
            </TableCell>
            <TableCell>
              <Badge className="text-xs capitalize">
                {transaction?.status}
              </Badge>
            </TableCell>
            <TableCell>
              {formatDateTimestamp(transaction?.created_at)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

const JournalEntryDetailsTable = ({ data }) => {
  const totalDebit = data?.reduce(
    (sum, item) => sum + parseFloat(item.debit_amount),
    0
  );
  const totalCredit = data?.reduce(
    (sum, item) => sum + parseFloat(item.credit_amount),
    0
  );
  return (
    <div className="rounded-md border mt-5">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account Code</TableHead>
            <TableHead>Account Title</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
            <TableHead>Memo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((entry, i) => (
            <TableRow key={entry.entry_detail_id ?? i}>
              <TableCell>
                <Link to={`/ledgers/accounts/${entry?.account_id}`}>
                  {entry.account_code}
                </Link>
              </TableCell>
              <TableCell>{entry.account_title}</TableCell>
              <TableCell className="text-right">
                {parseFloat(entry?.debit_amount)?.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {parseFloat(entry?.credit_amount)?.toLocaleString()}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{entry.memo || "—"}</TableCell>
            </TableRow>
          ))}
          <TableRow className="font-semibold bg-muted">
            <TableCell colSpan={2} className="text-end">Total:</TableCell>
            <TableCell className="text-right">{totalDebit?.toLocaleString()}</TableCell>
            <TableCell className="text-right">{totalCredit?.toLocaleString()}</TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
