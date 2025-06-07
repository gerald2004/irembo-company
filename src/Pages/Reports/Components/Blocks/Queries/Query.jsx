/* eslint-disable react/prop-types */
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";

const Query = ({ isRefetching, refetch }) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <CalendarDateRangePicker />
      <Button size="sm" onClick={refetch}>
        {isRefetching ? "Updating..." : "Update"}
      </Button>
      <Button size="sm" variant="outline">
        Export Excel
      </Button>
      <Button size="sm" variant="outline">
        Export PDF
      </Button>
      <Button size="sm" variant="outline">
        Send Email
      </Button>
      {/* <DatePickerMultiple /> */}
    </div>
  );
};

export default Query;
