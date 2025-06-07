/* eslint-disable react/prop-types */
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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

const DailyReportQuery = ({ onFilterChange, isRefetching }) => {
  const { control, handleSubmit, reset } = useForm();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const { auth } = useAuth();

  const { data: branches = [] } = useBranches();
  // Submit Handler
  const onSubmit = () => {
    onFilterChange({
      date: selectedDate.toLocaleDateString("en-CA"),
      branch_id: selectedBranch,
    });
    reset();
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex items-center space-x-2"
      >
        {/* Date Picker */}
        <div className="w-[250px]">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            placeholderText="Select Date"
          />
        </div>

        {/* Branch Selector */}
        {auth?.user?.data_privilege === "sacco" && (
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
        )}

        {/* Submit Button */}
        <Button size="sm" type="submit" disabled={isRefetching}>
          {isRefetching ? "Updating..." : "Update"}
        </Button>
      </form>
    </div>
  );
};

export default DailyReportQuery;
