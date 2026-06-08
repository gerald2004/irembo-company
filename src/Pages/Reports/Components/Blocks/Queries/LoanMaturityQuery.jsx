/* eslint-disable react/prop-types */
import { Button } from "@/components/ui/button";
import { Controller, useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { useBranches } from "@/Queries/Settings/branches";
import { toast } from "@/hooks/use-toast";
import fileDownload from "js-file-download";
import { prepareDataForExport } from "@/lib/utils";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useUsers } from "@/Queries/Settings/users";

const LoanMaturityQuery = ({
  onFilterChange,
  isRefetching,
  data,
  tableRef,
  filters,
  title,
  totals,
  colSpan,
  mode,
}) => {
  const { auth } = useAuth();
  const axiosPrivate = useAxiosPrivate();

  const [selectedBranch, setSelectedBranch] = useState(
    filters?.branch_id ?? ""
  );
  const [selectedUserId, setSelectedUserId] = useState(filters?.user_id ?? "");
  const [days, setDays] = useState(filters?.days ?? 30);

  const { data: branches = [] } = useBranches();
  const { data: users = [] } = useUsers();
  const { control, handleSubmit, reset } = useForm();

  // ✅ Submit Handler (no dates at all)
  const onSubmit = () => {
    onFilterChange({
      branch_id: selectedBranch,
      user_id: selectedUserId,
      days: days === "" ? "" : Number(days),
    });
    reset();
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const onDownload = async (type) => {
    if (!tableRef?.current) {
      toast({
        title: "Table not ready",
        variant: "destructive",
        description: "Cannot find the table instance.",
      });
      return;
    }

    const exportData = prepareDataForExport(tableRef.current, data);
    const controller = new AbortController();
    const today    = new Date();
    const future   = new Date(today);
    future.setDate(future.getDate() + (Number(days) || 30));
    const toISO = (d) => d.toISOString().slice(0, 10);
    const dataDownload = {
      data: exportData,
      totals: totals,
      colspan: colSpan,
      mode: mode,
      dates: {
        start_date: toISO(today),
        end_date:   toISO(future),
      },
      filters: {
        branch_id: selectedBranch || null,
        user_id: selectedUserId || null,
      },
      title: title,
    };

    try {
      setIsDownloading(true);
      let response;
      if (type === "pdf") {
        response = await axiosPrivate.post(
          `/export/general/pdf`,
          { data: dataDownload },
          { responseType: "blob", signal: controller.signal }
        );
      } else if (type === "xlsx") {
        response = await axiosPrivate.post(
          `/export/general/excel`,
          { data: dataDownload },
          { responseType: "blob", signal: controller.signal }
        );
      } else {
        throw new Error("Unknown export type");
      }

      const unix = Math.round(+new Date() / 1000);
      const fileType = type === "pdf" ? "pdf" : "xlsx";
      const downloadTitle = `${title}_${unix}.${fileType}`;

      fileDownload(response.data, downloadTitle);

      toast({
        title: `Download successful`,
        variant: "success",
        description: `Your ${fileType.toUpperCase()} file has been downloaded.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: "Failed to download file.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex items-center gap-2"
      >
        {/* Days input */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Days:</label>
          <input
            type="number"
            min="1"
            className="h-8 w-20 border rounded px-2 text-xs"
            value={days ?? ""}
            onChange={(e) =>
              setDays(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="30"
            title="Number of days from today"
          />
        </div>

        {/* Branch Selector */}
        {auth?.user?.data_privilege === "sacco" && (
          <>
            <Controller
              name="branch_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={selectedBranch}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedBranch(value);
                    // reset user if branch changes
                    setSelectedUserId("");
                  }}
                >
                  <SelectTrigger className="min-w-[180px]">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />

            <Controller
              name="user_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={selectedUserId}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedUserId(value);
                  }}
                >
                  <SelectTrigger className="min-w-[180px]">
                    <SelectValue placeholder="Select User" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((user) =>
                        selectedBranch
                          ? String(user.branch_id) === String(selectedBranch)
                          : true
                      )
                      .map((user) => (
                        <SelectItem
                          key={user.user_id}
                          value={String(user.user_id)}
                        >
                          {user.user_firstname} {user.user_lastname}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
          </>
        )}

        {/* Branch-level: show only users in own branch */}
        {auth?.user?.data_privilege === "branch" && (
          <Controller
            name="user_id"
            control={control}
            render={({ field }) => (
              <Select
                value={selectedUserId}
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedUserId(value);
                }}
              >
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(
                      (user) =>
                        String(user.branch_id) === String(auth.user.branch_id)
                    )
                    .map((user) => (
                      <SelectItem
                        key={user.user_id}
                        value={String(user.user_id)}
                      >
                        {user.user_firstname} {user.user_lastname}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          />
        )}

        {/* Submit Button */}
        <Button size="sm" type="submit" disabled={isRefetching}>
          {isRefetching ? "Updating..." : "Update"}
        </Button>
      </form>

      {/* Export buttons */}
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
    </div>
  );
};

export default LoanMaturityQuery;
