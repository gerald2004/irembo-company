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
import { useState, useMemo } from "react";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { toast } from "@/hooks/use-toast";
import fileDownload from "js-file-download";
import {
  formatDateTimestamp,
  getValidDate,
  prepareDataForExport,
} from "@/lib/utils";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useTills } from "@/Queries/Settings/tills";

const TillReportQuery = ({
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
  const [selectedTill, setSelectedTill] = useState("");
  const { auth } = useAuth();
  const axiosPrivate = useAxiosPrivate();

  const { data: tills = [] } = useTills();
  const { control, handleSubmit, reset } = useForm();
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(),
  });

  const handleDateChange = (range) => {
    if (range?.from && range?.to) {
      setDateRange({
        from: new Date(range.from),
        to: new Date(range.to),
      });
    }
  };

  const onSubmit = () => {
    const selectedTillInfo = tills.find(
      (till) => String(till.till_id) === selectedTill
    );
    const tillName = selectedTillInfo
      ? `${selectedTillInfo.staff.user_firstname} ${selectedTillInfo.staff.user_lastname}`
      : "";

    onFilterChange({
      startDate: dateRange.from.toLocaleDateString("en-CA"),
      endDate: dateRange.to.toLocaleDateString("en-CA"),
      till_id: selectedTill,
      till_name: tillName,
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
      title: filters.till_name ? `Till Sheet - ${filters.till_name}` : title,
    };

    try {
      setIsDownloading(true);
      let response;
      if (type === "pdf") {
        response = await axiosPrivate.post(
          `/export/general/pdf`,
          { data: dataDownload },
          {
            responseType: "blob",
            signal: controller.signal,
          }
        );
      }

      if (type === "xlsx") {
        response = await axiosPrivate.post(
          `/export/general/excel`,
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

  const filteredTills = useMemo(() => {
    if (auth?.user?.data_privilege === "branch") {
      return tills.filter(
        (till) => till.staff?.branch_id === auth.user?.branch_id
      );
    }
    return tills;
  }, [tills, auth]);

  return (
    <div className="flex items-center justify-center space-x-2">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex items-center space-x-2"
      >
        <div className="w-max-[300px]">
          <CalendarDateRangePicker
            defaultValue={dateRange}
            onChange={handleDateChange}
          />
        </div>

        {["branch", "sacco"].includes(auth?.user?.data_privilege) && (
          <Controller
            name="till_id"
            control={control}
            render={({ field }) => (
              <Select
                value={selectedTill}
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedTill(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Transaction Till" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTills.map((till) => (
                    <SelectItem key={till.till_id} value={String(till.till_id)}>
                      {till.staff.user_firstname} {till.staff.user_lastname} (
                      {till.staff.user_identification_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}

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

export default TillReportQuery;
