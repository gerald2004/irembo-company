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
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { toast } from "@/hooks/use-toast";
import fileDownload from "js-file-download";
import {
  formatDateTimestamp,
  getValidDate,
  prepareDataForExport,
} from "@/lib/utils";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useUsers } from "@/Queries/Settings/users";
const LoanGeneralReportQuery = ({
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
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const { auth } = useAuth();
  const axiosPrivate = useAxiosPrivate();

  const { data: branches = [] } = useBranches();
  const { data: users = [] } = useUsers();
  const { control, handleSubmit, reset } = useForm();
  const [dateRange, setDateRange] = useState({
    from: new Date(auth?.fiscalYear?.start_date),
    to: new Date(),
  });

  // ✅ Update date range
  const handleDateChange = (range) => {
    if (range?.from && range?.to) {
      setDateRange({
        from: new Date(range.from),
        to: new Date(range.to),
      });
    }
  };

  // ✅ Submit Handler
  const onSubmit = () => {
    onFilterChange({
      startDate: dateRange.from.toLocaleDateString("en-CA"),
      endDate: dateRange.to.toLocaleDateString("en-CA"),
      branch_id: selectedBranch,
      user_id: selectedUserId,
    });
    reset();
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const onDownload = async (type) => {
    if (!tableRef.current) {
      toast({
        title: "Table not ready",
        variant: "destructive",
        description: "Cannot find the table instance.",
      });
      return;
    }

    const exportData = prepareDataForExport(tableRef.current, data);
    const controller = new AbortController();
    const dataDownload = {
      data: exportData,
      totals: totals,
      colspan: colSpan,
      mode: mode,
      dates: {
        start_date: formatDateTimestamp(
          getValidDate(filters.startDate, auth?.fiscalYear?.start_date)
        ),
        end_date: formatDateTimestamp(
          getValidDate(filters.endDate, new Date())
        ),
      },
      title: title,
    };
    // console.log(dataDownload);
    try {
      setIsDownloading(true);
      let response;
      if (type === "pdf") {
        response = await axiosPrivate.post(
          `/export/general/pdf`, // <-- Your endpoint
          { data: dataDownload },
          {
            responseType: "blob",
            signal: controller.signal,
          }
        );
      }

      if (type === "xlsx") {
        response = await axiosPrivate.post(
          `/export/general/excel`, // <-- Your endpoint
          { data: dataDownload },
          {
            responseType: "blob",
            signal: controller.signal,
          }
        );
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
      setIsDownloading(false);
    } catch (error) {
      console.log(error);
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: "Failed to download file.",
      });
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex items-center space-x-2"
      >
        {/* Date Picker */}
        <div className="w-max-[300px]">
          <CalendarDateRangePicker
            defaultValue={dateRange}
            onChange={handleDateChange}
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
                  }}
                >
                  <SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select User" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((user) => {
                        if (!selectedBranch) return true; // show all if no branch selected
                        return (
                          String(user.branch_id) === String(selectedBranch)
                        );
                      })
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
                <SelectTrigger>
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((user) => {
                      return (
                        String(user.branch_id) === String(auth.user.branch_id)
                      );
                    })
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

export default LoanGeneralReportQuery;
