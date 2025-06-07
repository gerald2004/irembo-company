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

export function AccountingReportTable() {
  const data = [
    {
      id: 1,
      title: "Trial Balance",
      link: "accounting-reports/trial-balance",
      acronym: "financial-reports",
      category: "Financial Reports",
    },
    {
      id: 2,
      title: "Income Statement",
      link: "accounting-reports/income-statement",
      acronym: "financial-reports",
      category: "Financial Reports",
    },
    {
      id: 3,
      title: "Balance Sheet",
      link: "accounting-reports/balance-sheet",
      acronym: "financial-reports",
      category: "Financial Reports",
    },
    {
      id: 4,
      title: "Cash Flow Statement",
      link: "accounting-reports/cash-flow",
      acronym: "financial-reports",
      category: "Financial Reports",
    },
    {
      id: 5,
      title: "General Ledger",
      link: "accounting-reports/general-ledger",
      acronym: "financial-reports",
      category: "Financial Reports",
    },

    {
      id: 6,
      title: "Till Sheet",
      link: "accounting-reports/till-sheet",
      acronym: "financial-reports",
      category: "Financial Reports",
    },
    {
      id: 7,
      title: "Day Sheet",
      link: "accounting-reports/day-sheet",
      acronym: "financial-reports",
      category: "Financial Reports",
    },
    {
      id: 8,
      title: "Cash Book",
      link: "accounting-reports/cash-book",
      acronym: "financial-reports",
      category: "Financial Reports",
    },
    {
      id: 9,
      title: "Income Reports",
      link: "accounting-reports/income-reports",
      acronym: "financial-reports",
      category: "Financial Reports",
    },
    {
      id: 10,
      title: "Expense Reports",
      link: "accounting-reports/expense-reports",
      acronym: "financial-reports",
      category: "Financial Reports",
    },
    {
      id: 11,
      title: "Income Report Detailed",
      link: "accounting-reports/income-report-detailed",
      acronym: "financial-reports",
      category: "Financial Reports",
    },
    {
      id: 12,
      title: "Expense Report Detailed",
      link: "accounting-reports/expense-report-detailed",
      acronym: "financial-reports",
      category: "Financial Reports",
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
      accessorKey: "financial-reports",
      header: "Financial Reports",
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
