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

export function SavingsReportTable() {
  const data = [
    {
      id: 1,
      title: "Savings Report",
      link: "savings-reports/savings",
      acronym: "savings-reports",
      category: "Savings Reports",
    },

    {
      id: 2,
      title: "Withdraws Report",
      link: "savings-reports/withdraws",
      acronym: "savings-reports",
      category: "Savings Reports",
    },
  ];

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
      accessorKey: "savings-reports",
      header: "Savings Reports",
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
