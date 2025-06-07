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
import { Folder, FolderOpen, FileText, Plus, Edit } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddSubgroupForm from "./Components/BusinessDefaults/Forms/AddSubgroupForm";
import AddAccountForm from "./Components/BusinessDefaults/Forms/AddAccountForm";
import EditSubgroupForm from "./Components/BusinessDefaults/Forms/EditSubgroupForm";
import EditAccountForm from "./Components/BusinessDefaults/Forms/EditAccountForm";

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
        if (!response.data.data) {
          throw new Error(response?.data?.message);
        }
        return response.data.data.chart_of_accounts;
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw new Error(error?.response?.data?.message);
      }
    },
  });

  const [selectedItem, setSelectedItem] = useState(null);

  const [openAccordionIds, setOpenAccordionIds] = useState([]);

  // Toggle between Folder and FolderOpen icons
  const toggleAccordion = (id) => {
    setOpenAccordionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Handle item selection for displaying actions
  const handleItemClick = (item, type, action) => {
    setSelectedItem({ ...item, type, action });
  };

  // Render accounts and sub-accounts with icons and hierarchy
  const renderAccounts = (data) => {
    return data.map((item) => {
      const isOpen = openAccordionIds.includes(item.id);
      return (
        <AccordionItem key={item.id} value={`item-${item.id}`}>
          <div className="flex items-center justify-between">
            {/* Accordion Trigger */}
            <AccordionTrigger onClick={() => toggleAccordion(item.id)}>
              <div className="flex items-center space-x-2">
                {isOpen ? <FolderOpen /> : <Folder />}
                <span>
                  {item.account_name || item.title}{" "}
                  {item.account_code && (
                    <span className="text-muted-foreground">
                      ({item.account_code || item.code})
                    </span>
                  )}
                </span>
              </div>
            </AccordionTrigger>

            {/* Action Buttons for Account Group */}
            {item.sub_accounts && (
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(item, "group", "add-subgroup");
                  }}
                >
                  <Plus size={16} />
                </Button>
              </div>
            )}
          </div>

          {/* Sub-Accounts */}
          {item.sub_accounts && item.sub_accounts.length > 0 && (
            <AccordionContent>
              <div className="ml-6">
                {item.sub_accounts.map((subgroup) => (
                  <AccordionItem key={subgroup.id} value={`sub-${subgroup.id}`}>
                    <div className="flex items-center justify-between">
                      {/* Subgroup Trigger */}
                      <AccordionTrigger
                        onClick={() => toggleAccordion(subgroup.id)}
                      >
                        <div className="flex items-center space-x-2">
                          {isOpen ? <FolderOpen /> : <Folder />}
                          <span>
                            {subgroup.title}
                            {subgroup.code && (
                              <span className="text-muted-foreground">
                                ({subgroup.code})
                              </span>
                            )}
                          </span>
                        </div>
                      </AccordionTrigger>

                      {/* Action Buttons for Subgroup */}
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(subgroup, "subgroup", "edit");
                          }}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(
                              subgroup,
                              "subgroup",
                              "add-account"
                            );
                          }}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                    </div>

                    {/* Accounts */}
                    {subgroup.accounts && subgroup.accounts.length > 0 && (
                      <AccordionContent>
                        <ul className="ml-8 list-none space-y-2">
                          {subgroup.accounts.map((account) => (
                            <li
                              key={account.id}
                              className="flex items-center justify-between pl-2"
                            >
                              <Link
                                to={`/ledgers/accounts/${account.id}`}
                                className="flex items-center space-x-2"
                              >
                                <FileText />
                                <span>
                                  {account.title}{" "}
                                  <span className="text-muted-foreground">
                                    ({account.code})
                                  </span>
                                </span>
                              </Link>
                              {/* Action Button for Account */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleItemClick(
                                    account,
                                    "account",
                                    "edit-account"
                                  )
                                }
                              >
                                <Edit size={16} />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    )}
                  </AccordionItem>
                ))}
              </div>
            </AccordionContent>
          )}
        </AccordionItem>
      );
    });
  };

  // Render form for selected action
  const renderForm = () => {
    if (!selectedItem) return null;

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
        <div className="flex items-center justify-between space-y-2">
          <h5 className="text-2xl font-bold tracking-tight">
            Chart Of Accounts
          </h5>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4 p-0 pt-2">
          <Card className="max-w-2xl mx-auto shadow-sm">
            <CardHeader>
              <CardTitle className="text-center">Chart of Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || isRefetching ? (
                <Skeleton className="h-[150px] rounded-xl" />
              ) : isError ? (
                <Button onClick={refetch}>Retry</Button>
              ) : (
                <Accordion type="multiple">
                  {renderAccounts(chartData)}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="flex-1">{renderForm()}</div>
      </div>
    </>
  );
};

export default ChartOfAccounts;
