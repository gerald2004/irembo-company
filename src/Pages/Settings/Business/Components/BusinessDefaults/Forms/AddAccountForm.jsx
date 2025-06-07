/* eslint-disable react/prop-types */
import { useForm, Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

const AddAccountForm = ({ subgroup, refetch }) => {
    const axiosPrivate = useAxiosPrivate();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: "",
      code: "",
      manual_entry: "no",
      opening_balance: 0,
      balance_type: "debit",
      opening_balance_date: null, // Add date field
      description: "",
      subgroupid: subgroup?.id || "", // Use subgroup ID from props
    },
  });

  // Generate account code based on name and random number
  const onSubmit = async (data) => {
          const controller = new AbortController();

    // Format the date to YYYY-MM-DD
    const formattedData = {
      ...data,
      opening_balance_date: data.opening_balance_date
        ? data.opening_balance_date.toISOString().split("T")[0]
        : null,
      opening_balance: parseFloat(data.opening_balance),
      subgroupid: subgroup?.id,
    };

     try {
      const response = await axiosPrivate.post(
        `/settings/accounts/account`,
        formattedData,
        { signal: controller.signal }
      );
      toast({ title: "Success", description: response?.data?.messages });
      reset();
      refetch();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: errorMessage,
      });
    }
  };

  return (
    <Card className="max-w-lg mx-auto shadow-sm">
      <CardHeader>
        <CardTitle>Add Account to {subgroup?.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Account Title</Label>
              <Input
                id="title"
                placeholder="Enter account title"
                {...register("title", {
                  required: "Account title is required",
                })}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Code */}
            <div>
              <Label htmlFor="code">Account Code</Label>
              <Input
                id="code"
                {...register("code", {
                  required: "Account code is required",
                })}
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
            </div>

            {/* Balance Type */}
            <div>
              <Label htmlFor="balance_type">Balance Type</Label>
              <Controller
                name="balance_type"
                control={control}
                rules={{ required: "Balance type is required" }}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Balance Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="debit">Debit</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.balance_type && (
                <p className="text-sm text-red-500">
                  {errors.balance_type.message}
                </p>
              )}
            </div>

            {/* Opening Balance */}
            <div>
              <Label htmlFor="opening_balance">Opening Balance</Label>
              <Input
                id="opening_balance"
                type="number"
                step="0.01"
                placeholder="Enter opening balance"
                {...register("opening_balance", {
                  required: "Opening balance is required",
                  valueAsNumber: true, // Ensure it's treated as a number
                })}
              />
              {errors.opening_balance && (
                <p className="text-sm text-red-500">
                  {errors.opening_balance.message}
                </p>
              )}
            </div>

            {/* Opening Balance Date */}
            <div>
              <Label htmlFor="opening_balance_date">Opening Balance Date</Label>
              <Controller
                name="opening_balance_date"
                control={control}
                rules={{ required: "Opening balance date is required" }}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          field.value.toLocaleDateString()
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.opening_balance_date && (
                <p className="text-sm text-red-500">
                  {errors.opening_balance_date.message}
                </p>
              )}
            </div>

            {/* Manual Entry */}
            <div>
              <Label htmlFor="manual_entry">Manual Entry (Yes/No)</Label>
              <Controller
                name="manual_entry"
                control={control}
                rules={{ required: "Manual entry is required" }}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Manual Entry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.manual_entry && (
                <p className="text-sm text-red-500">
                  {errors.manual_entry.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter description"
                {...register("description", {
                  required: "Description is required",
                })}
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="mt-4">
            {isSubmitting ? `Saving Please Wait...` : `Save Account`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddAccountForm;
