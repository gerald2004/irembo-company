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
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Folder,
  FolderOpen,
  FileText,
  Plus,
  Edit,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddSubgroupForm from "./Components/BusinessDefaults/Forms/AddSubgroupForm";
import AddAccountForm from "./Components/BusinessDefaults/Forms/AddAccountForm";
import EditSubgroupForm from "./Components/BusinessDefaults/Forms/EditSubgroupForm";
import EditAccountForm from "./Components/BusinessDefaults/Forms/EditAccountForm";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const ChartOfAccounts = () => {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();

  const {
    data: chartData,
    isLoading,
    isRefetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["chart-of-accounts"],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `/settings/accounts/chart-of-accounts`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        if (!response.data?.data) {
          throw new Error(response?.data?.message || "No data");
        }
        return response.data.data.chart_of_accounts || [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw new Error(error?.response?.data?.message || "Failed to load");
      }
    },
  });

  // UI state
  const [openGroups, setOpenGroups] = useState([]); // values like "group-<id>"
  const [openSubgroups, setOpenSubgroups] = useState({}); // { [groupId]: Set(subgroupId) }
  const [selectedItem, setSelectedItem] = useState(null); // { ...item, type, action }
  const [query, setQuery] = useState("");

  // Helpers
  const toggleSubgroup = (groupId, subgroupId) => {
    setOpenSubgroups((prev) => {
      const set = new Set(prev[groupId] || []);
      set.has(subgroupId) ? set.delete(subgroupId) : set.add(subgroupId);
      return { ...prev, [groupId]: set };
    });
  };

  const isSubgroupOpen = (groupId, subgroupId) =>
    (openSubgroups[groupId] || new Set()).has(subgroupId);

  const handleItemClick = (item, type, action) => {
    setSelectedItem({ ...item, type, action });
  };

  const clearSelection = () => setSelectedItem(null);

  const allGroupValues = useMemo(
    () => (chartData || []).map((g) => `group-${g.id}`),
    [chartData]
  );

  const handleExpandAll = () => setOpenGroups(allGroupValues);
  const handleCollapseAll = () => setOpenGroups([]);

  // Filter logic (matches group/subgroup/account title/code)
  const filteredData = useMemo(() => {
    if (!query?.trim()) return chartData || [];

    const q = query.toLowerCase();
    const matches = (txt) => (txt || "").toString().toLowerCase().includes(q);

    return (chartData || [])
      .map((group) => {
        const groupMatch =
          matches(group.account_name || group.title) ||
          matches(group.account_code || group.code);

        const subgroups = (group.sub_accounts || [])
          .map((sg) => {
            const sgMatch = matches(sg.title) || matches(sg.code);
            const accounts = (sg.accounts || []).filter(
              (acc) => matches(acc.title) || matches(acc.code)
            );
            if (sgMatch || accounts.length > 0) {
              return { ...sg, accounts };
            }
            return null;
          })
          .filter(Boolean);

        if (groupMatch || subgroups.length > 0) {
          return { ...group, sub_accounts: subgroups };
        }
        return null;
      })
      .filter(Boolean);
  }, [chartData, query]);

  const emptyState = !isLoading && !isError && filteredData.length === 0;

  // Counts for quick glance
  const countSubgroups = (g) => (g?.sub_accounts || []).length;
  const countAccounts = (g) =>
    (g?.sub_accounts || []).reduce(
      (sum, sg) => sum + (sg?.accounts?.length || 0),
      0
    );

  // Right-side inspector content
  const renderForm = () => {
    if (!selectedItem) {
      return (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Inspector</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Select a group, subgroup, or account to edit — or use the + buttons
            to add new items.
          </CardContent>
        </Card>
      );
    }

    const { action } = selectedItem;
    if (action === "add-subgroup") {
      return <AddSubgroupForm parentGroup={selectedItem} refetch={refetch} />;
    }
    if (action === "add-account") {
      return <AddAccountForm subgroup={selectedItem} refetch={refetch} />;
    }
    if (action === "edit") {
      return <EditSubgroupForm subgroup={selectedItem} refetch={refetch} />;
    }
    if (action === "edit-account") {
      return <EditAccountForm account={selectedItem} refetch={refetch} />;
    }
    return null;
  };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Chart Of Accounts</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex items-center justify-between py-2">
          <h5 className="text-2xl font-bold tracking-tight">
            Chart Of Accounts
          </h5>

          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 w-[240px]"
                placeholder="Search title / code..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={handleExpandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={handleCollapseAll}>
              Collapse All
            </Button>
            {selectedItem && (
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear Selection
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: Tree */}
        <div className="flex-1 space-y-4 p-0 pt-2">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Accounts Structure</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || isRefetching ? (
                <div className="space-y-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full rounded-md" />
                  ))}
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-muted-foreground">
                    Something went wrong loading accounts.
                  </p>
                  <Button onClick={refetch} size="sm">
                    Retry
                  </Button>
                </div>
              ) : emptyState ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  No results match your search.
                </div>
              ) : (
                <Accordion
                  type="multiple"
                  value={openGroups}
                  onValueChange={setOpenGroups}
                >
                  {filteredData.map((group) => {
                    const groupValue = `group-${group.id}`;
                    const isOpen = openGroups.includes(groupValue);
                    const subgroupCount = countSubgroups(group);
                    const accountCount = countAccounts(group);

                    return (
                      <AccordionItem key={group.id} value={groupValue}>
                        {/* Group header */}
                        <AccordionTrigger className="py-2">
                          <div className="flex items-center gap-2">
                            {isOpen ? <FolderOpen /> : <Folder />}
                            <span className="font-medium">
                              {group.account_name || group.title}
                            </span>
                            {(group.account_code || group.code) && (
                              <span className="text-muted-foreground ml-1">
                                ({group.account_code || group.code})
                              </span>
                            )}
                            <div className="ml-2 flex items-center gap-1">
                              <Badge variant="secondary">
                                {subgroupCount} sub
                              </Badge>
                              <Badge variant="secondary">
                                {accountCount} acc
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>

                        {/* Group content */}
                        <AccordionContent>
                          <div className="flex justify-end mb-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemClick(group, "group", "add-subgroup");
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Subgroup
                            </Button>
                          </div>

                          {/* Subgroups */}
                          {(group.sub_accounts || []).length === 0 ? (
                            <div className="text-xs text-muted-foreground pl-2 py-2">
                              No subgroups yet.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {group.sub_accounts.map((sg) => {
                                const open = isSubgroupOpen(group.id, sg.id);
                                return (
                                  <div
                                    key={sg.id}
                                    className="rounded-md border p-2 bg-muted/20"
                                  >
                                    <div className="flex items-center justify-between">
                                      <button
                                        type="button"
                                        className="flex items-center gap-2 text-left"
                                        onClick={() =>
                                          toggleSubgroup(group.id, sg.id)
                                        }
                                      >
                                        <ChevronRight
                                          className={`h-4 w-4 transition-transform ${
                                            open ? "rotate-90" : ""
                                          }`}
                                        />
                                        <span className="font-medium">
                                          {sg.title}
                                        </span>
                                        {sg.code && (
                                          <span className="text-muted-foreground ml-1">
                                            ({sg.code})
                                          </span>
                                        )}
                                        <Badge
                                          className="ml-2"
                                          variant="secondary"
                                        >
                                          {(sg.accounts || []).length} acc
                                        </Badge>
                                      </button>

                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleItemClick(
                                              sg,
                                              "subgroup",
                                              "edit"
                                            );
                                          }}
                                          title="Edit Subgroup"
                                        >
                                          <Edit size={16} />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleItemClick(
                                              sg,
                                              "subgroup",
                                              "add-account"
                                            );
                                          }}
                                          title="Add Account"
                                        >
                                          <Plus size={16} />
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Accounts list */}
                                    {open && (
                                      <ul className="mt-2 ml-6 list-none space-y-1">
                                        {(sg.accounts || []).length === 0 ? (
                                          <li className="text-xs text-muted-foreground">
                                            No accounts in this subgroup.
                                          </li>
                                        ) : (
                                          sg.accounts.map((acc) => (
                                            <li
                                              key={acc.id}
                                              className="flex items-center justify-between py-1 pr-1"
                                            >
                                              <Link
                                                to={`/ledgers/accounts/${acc.id}`}
                                                className="flex items-center gap-2"
                                              >
                                                <FileText />
                                                <span>
                                                  {acc.title}{" "}
                                                  <span className="text-muted-foreground">
                                                    ({acc.code})
                                                  </span>
                                                </span>
                                              </Link>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  handleItemClick(
                                                    acc,
                                                    "account",
                                                    "edit-account"
                                                  )
                                                }
                                                title="Edit Account"
                                              >
                                                <Edit size={16} />
                                              </Button>
                                            </li>
                                          ))
                                        )}
                                      </ul>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Inspector / Forms */}
        <div className="flex-1 space-y-4">
          {selectedItem && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedItem.type === "group" && "Group"}
                {selectedItem.type === "subgroup" && "Subgroup"}
                {selectedItem.type === "account" && "Account"}{" "}
                <span className="font-medium text-foreground">
                  {selectedItem.account_name ||
                    selectedItem.title ||
                    selectedItem.account?.title}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          )}
          {renderForm()}
        </div>
      </div>
    </>
  );
};

export default ChartOfAccounts;
