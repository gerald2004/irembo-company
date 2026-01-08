import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useUsers } from "@/Queries/Settings/users";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
const PayrollManagement = () => {
  const { data: clients, isLoading, isError } = useUsers();
  const employees = clients ?? [];

  const { control, register, handleSubmit } = useForm({
    defaultValues: {
      payrollMonth: format(new Date(), "yyyy-MM"),
      paymentDate: new Date(), // Default to today
      notes: "",
    },
  });

  const onSubmit = (data) => {
    // Prepare payload
    console.log("Submitting Payroll:", data);
  };

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Failed to load users</p>;

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Payroll</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">Payroll</h5>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4 p-0 pt-2">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Payroll Generation</h2>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div>
                        <Label className="mb-1">Payroll Month</Label>
                        <Controller
                          name="payrollMonth"
                          control={control}
                          rules={{ required: "Payroll month is required" }}
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select month" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 12 }).map((_, index) => {
                                  const date = new Date();
                                  date.setMonth(index);
                                  const value = `${date.getFullYear()}-${String(
                                    index + 1
                                  ).padStart(2, "0")}`;
                                  const label = date.toLocaleString("default", {
                                    month: "long",
                                  });
                                  return (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div>
                        <Label>Payment Date</Label>
                        <Controller
                          name="paymentDate"
                          control={control}
                          rules={{ required: "Payment date is required" }}
                          render={({ field }) => (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className="w-full pl-3 text-left font-normal"
                                >
                                  {field?.value ? (
                                    new Date(field?.value)?.toLocaleDateString()
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date("2000-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Notes</Label>
                      <Textarea
                        name="notes"
                        {...register("notes")}
                        placeholder="Optional notes about this payroll"
                      />
                    </div>

                    <h3 className="text-lg font-medium mb-2">Employees</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Job Title</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Branch</TableHead>
                          <TableHead className="text-right">
                            Salary ()
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.map((user) => (
                          <TableRow key={user.user_id}>
                            <TableCell>
                              {user.user_firstname} {user.user_lastname}
                            </TableCell>
                            <TableCell>{user.user_job_title}</TableCell>
                            <TableCell>
                              {user.department?.department_name || "-"}
                            </TableCell>
                            <TableCell>
                              {user.branch?.branch_name || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {parseFloat(user.user_salary).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="mt-6 flex justify-end">
                      <Button>Generate Payslips</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PayrollManagement;
