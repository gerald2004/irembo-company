/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";

import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Datatable from "@/Pages/Components/Datatable";
import { toast } from "@/hooks/use-toast";
import AlertModal from "@/components/AlertModal";

import AddLinkedAccountDialog from "../Forms/AddLinkedAccountDialog";
import EditLinkedAccountDialog from "../Forms/EditLinkedAccountDialog";

export function LinkedAccountTable() {
  const navigate = useNavigate();
  const location = useLocation();
  const axiosPrivate = useAxiosPrivate();

  // Filters
  const [typeFilter, setTypeFilter] = useState(""); // '', 'cash','bank','mobile_money','safe'
  const [branchFilter, setBranchFilter] = useState(""); // '', '<branch_id>'
  const [search, setSearch] = useState("");

  // Dialogs
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editRow, setEditRow] = useState(null);

  // Delete
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Fetch linked accounts
  const {
    data: linked = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["linked-accounts", typeFilter, branchFilter],
    queryFn: async () => {
      const controller = new AbortController();
      const params = [];
      if (typeFilter) params.push(`type=${encodeURIComponent(typeFilter)}`);
      if (branchFilter)
        params.push(`branch_id=${encodeURIComponent(branchFilter)}`);
      const qs = params.length ? `?${params.join("&")}` : "";
      try {
        const res = await axiosPrivate.get(`/settings/accounts/linked${qs}`, {
          signal: controller.signal,
        });
        return res?.data?.data?.linked_accounts ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    keepPreviousData: true,
  });

  // Fetch accounts for combobox in dialogs
  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    isError: isErrorAccounts,
    refetch: refetchAccounts,
    isRefetching: isRefetchingAccounts,
  } = useQuery({
    queryKey: ["accounts-votes"],
    queryFn: async () => {
      const controller = new AbortController();
      const res = await axiosPrivate.get("/settings/accounts/account", {
        signal: controller.signal,
      });
      return res?.data?.data?.accounts ?? [];
    },
  });

  // Fetch branches for mapping
  const { data: branchList = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const controller = new AbortController();
      try {
        const res = await axiosPrivate.get(`/settings/branches`, {
          signal: controller.signal,
        });
        return res?.data?.data?.branches ?? [];
      } catch (e) {
        console.log(e);
        return [];
      }
    },
  });

  const filtered = useMemo(() => {
    if (!search) return linked;
    const s = search.toLowerCase();
    return linked.filter((row) => {
      const title = (row.account_title || "").toLowerCase();
      const prov = (row.provider_name || "").toLowerCase();
      const pref = (row.provider_reference || "").toLowerCase();
      return title.includes(s) || prov.includes(s) || pref.includes(s);
    });
  }, [linked, search]);

  const openEdit = (row) => {
    setEditRow(row);
    setShowEdit(true);
  };

  const openDelete = (id) => {
    setDeleteId(id);
    setShowDelete(true);
  };

  const doDelete = async () => {
    const controller = new AbortController();
    try {
      const res = await axiosPrivate.delete(
        `/settings/accounts/linked/${deleteId}`,
        {
          signal: controller.signal,
        }
      );
      toast({
        title: "Success",
        description: res?.data?.messages || "Deleted successfully",
      });
      setShowDelete(false);
      setDeleteId(null);
      refetch();
    } catch (error) {
      const msg = error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: msg,
      });
    }
  };

  const typeBadges = {
    cash: "bg-amber-100 text-amber-800",
    bank: "bg-blue-100 text-blue-800",
    mobile_money: "bg-emerald-100 text-emerald-800",
    safe: "bg-slate-100 text-slate-800",
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
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
    },
    {
      accessorKey: "account_title",
      header: "Account",
      cell: ({ row }) => <p>{row.original.account_title || "N/A"}</p>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const t = row.original.type;
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              typeBadges[t] || "bg-gray-100 text-gray-800"
            }`}
          >
            {t?.replace("_", " ")}
          </span>
        );
      },
    },
    {
      accessorKey: "provider_name",
      header: "Provider",
      cell: ({ row }) => <p>{row.original.provider_name || "—"}</p>,
    },
    {
      accessorKey: "provider_reference",
      header: "Reference",
      cell: ({ row }) => (
        <p className="font-mono text-xs">
          {row.original.provider_reference || "—"}
        </p>
      ),
    },
    {
      accessorKey: "is_global",
      header: "Visibility",
      cell: ({ row }) => (
        <p>{row.original.is_global ? "Global" : "Per-branch"}</p>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              aria-label="Open row actions"
            >
              ...
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => openEdit(row.original)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openDelete(row.original.linked_account_id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
        <div className="flex gap-2">
          {/* Type filter with sentinel */}
          <Select
            value={typeFilter === "" ? "__ALL__" : typeFilter}
            onValueChange={(v) => setTypeFilter(v === "__ALL__" ? "" : v)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="type-all" value="__ALL__">
                All Types
              </SelectItem>
              <SelectItem key="type-cash" value="cash">
                Cash
              </SelectItem>
              <SelectItem key="type-bank" value="bank">
                Bank
              </SelectItem>
              <SelectItem key="type-mm" value="mobile_money">
                Mobile Money
              </SelectItem>
              <SelectItem key="type-safe" value="safe">
                Cash Safe
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Branch filter with sentinel */}
          <Select
            value={branchFilter === "" ? "__ALL__" : branchFilter}
            onValueChange={(v) => setBranchFilter(v === "__ALL__" ? "" : v)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="branch-all" value="__ALL__">
                All Branches
              </SelectItem>
              {branchList.map((b) => (
                <SelectItem
                  key={`branch-${b.id}`}
                  value={String(b.id)}
                >
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:ml-auto flex gap-2">
          <Input
            placeholder="Search account/provider/reference"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[280px]"
          />
          <Button onClick={() => setShowAdd(true)}>+ Add Linked Account</Button>
        </div>
      </div>

      <Datatable
        columns={columns}
        data={filtered}
        fetchData={refetch}
        isLoading={isLoading}
        isRefetching={isRefetching}
        isError={isError}
      />

      {/* Add */}
      <AddLinkedAccountDialog
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        refetch={refetch}
        accountsData={accountsData}
        isLoadingAccounts={isLoadingAccounts}
        isErrorAccounts={isErrorAccounts}
        refetchAccounts={refetchAccounts}
        isRefetchingAccounts={isRefetchingAccounts}
        branchList={branchList}
      />

      {/* Edit */}
      <EditLinkedAccountDialog
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        refetch={refetch}
        defaultValues={editRow}
        accountsData={accountsData}
        isLoadingAccounts={isLoadingAccounts}
        isErrorAccounts={isErrorAccounts}
        refetchAccounts={refetchAccounts}
        isRefetching={isRefetchingAccounts}
        branchList={branchList}
      />

      {/* Delete Confirm */}
      <AlertModal
        showDialog={showDelete}
        setShowDialog={() => setShowDelete(false)}
        title="Are you sure?"
        message="This will permanently delete this linked account."
        method={doDelete}
        buttonName="Delete"
      />
    </>
  );
}
