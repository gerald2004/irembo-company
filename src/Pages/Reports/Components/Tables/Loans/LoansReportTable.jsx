import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import "jspdf-autotable";
import Datatable from "@/Pages/Components/Datatable";

export function LoansReportTable() {
  const data = [
    {
      id: 1,
      title: "Loans Applications",
      link: "loans-reports/loan-applications",
      acronym: "loans-reports",
      category: "Loans Reports",
    },

    {
      id: 2,
      title: "Active Loans",
      link: "loans-reports/active-loans",
      acronym: "loans-reports",
      category: "Loans Reports",
    },
    {
      id: 3,
      title: "Overdue Loans",
      link: "loans-reports/overdue-loans",
      acronym: "loans-reports",
      category: "Loans Reports",
    },
    {
      id: 14,
      title: "Loan Portfolio Summary",
      link: "loans-reports/loan-portfolio/summary",
      acronym: "loans-reports",
      category: "Loans Reports",
    },
    {
      id: 4,
      title: "Loan Portfolio",
      link: "loans-reports/loan-portfolio",
      acronym: "loans-reports",
      category: "Loans Reports",
    },
    {
      id: 5,
      title: "Loan Balances",
      link: "loans-reports/loan-balances",
      acronym: "loans-reports",
      category: "Loans Reports",
    },
    {
      id: 6,
      title: "Loan Aging Report",
      link: "loans-reports/aging-loans",
      acronym: "loans-reports",
      category: "Loans Reports",
    },
    {
      id: 7,
      title: "Settled Loans",
      link: "loans-reports/settled-loans",
      acronym: "loans-reports",
      category: "Loans Reports",
    },
    {
      id: 8,
      title: "Writtern Off Loans",
      link: "loans-reports/writtern-off-loans",
      acronym: "loans-reports",
      category: "Loans Reports",
    },
    {
      id: 11,
      title: "Rejected Loan Report",
      link: "loans-reports/rejected-loans",
      acronym: "loans-reports",
      category: "Loans Reports",
    },
    {
      id: 9,
      title: "Loan Recovery Report",
      link: "loans-reports/loans-recovery",
      acronym: "loans-reports",
      category: "Loans Reports",
    },
    {
      id: 10,
      title: "Loan Maturity Report",
      link: "loans-reports/loan-maturity-report",
      acronym: "loans-reports",
      category: "Loans Reports",
    },
    {
      id: 12,
      title: "Loan Disbursement Report",
      link: "loans-reports/loan-disbursement-report",
      acronym: "loans-reports",
      category: "Loans Reports",
    },
    {
      id: 13,
      title: "Loan Expected Interest Report",
      link: "loans-reports/loans-expected-interest",
      acronym: "loans-reports",
      category: "Loans Reports",
    },
  ];
  // console.log(data.length);
  

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
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <Link
          to={`/${row.original.link}`}
          className="capitalize hover:uppercase"
        >
          {row.original.title}
        </Link>
      ),
    },

    {
      accessorKey: "loan-reports",
      header: "Loan Reports",
      cell: ({ row }) => (
        <p className="capitalize hover:uppercase">{row.original.category}</p>
      ),
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
            <DropdownMenuItem>
              <Link to={`/${row.original.link}`}>View {row.original.title}</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <Datatable columns={columns} data={data} />
    </>
  );
}
