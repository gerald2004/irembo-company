/* eslint-disable react/prop-types */
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { useState } from "react";
import useAuth from "@/MiddleWares/Hooks/useAuth";
const ClientStatementQuery = ({ onFilterChange, isRefetching }) => {
  const { handleSubmit, reset } = useForm();
   const { auth } = useAuth();
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
     if (dateRange.from && dateRange.to) {
       onFilterChange({
         startDate: dateRange.from.toLocaleDateString("en-CA"),
         endDate: dateRange.to.toLocaleDateString("en-CA"),
       });
      reset();
     } else {
       console.log("Please select a valid date range");
     }
   };


  return (
    <div className="flex items-center justify-center space-x-2">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex items-center space-x-2"
      >
        {/* Calendar Date Range Picker */}
        <div className="w-max-[300px]">
          <CalendarDateRangePicker
            defaultValue={dateRange}
            onChange={handleDateChange}
          />
        </div>

        {/* Submit Button */}
        <Button size="sm" type="submit" disabled={isRefetching}>
          {isRefetching ? "Updating..." : "Update"}
        </Button>
      </form>
    </div>
  );
};

export default ClientStatementQuery;
