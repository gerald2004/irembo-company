/* eslint-disable react/prop-types */
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
const EditAccountForm = ({ account, refetch }) => {
  const axiosPrivate = useAxiosPrivate();
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: account.title,
      code: account.code,
      description: account.description,
      date: null, // Initialize date as null
      opening_balance: "",
      balance_type: "",
    },
  });

  const defaultValues = account;

  useEffect(() => {
        if (defaultValues) {
          for (const [key, value] of Object.entries(defaultValues)) {
            setValue(key, value);
          }
        }
      }, [defaultValues, setValue]);


  const onSubmit = async (data) => {
          const controller = new AbortController();

    // Format the date to YYYY-MM-DD
    const formattedData = {
      ...data,
      opening_balance_date: data.opening_balance_date
        ? data.opening_balance_date.toISOString().split("T")[0]
        : null,
      opening_balance: parseFloat(data.opening_balance), 
    };

    try {
      const response = await axiosPrivate.patch(
        `/settings/accounts/account/${account.id}`,
        formattedData,
        {
          signal: controller.signal,
        }
      );
      toast({ title: "Success", description: response?.data?.messages });
      refetch();
    } catch (error) {
      // console.error(error);
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
        <CardTitle>Edit {account?.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Account Title</Label>
            <Input
              id="title"
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
            <Input id="code" {...register("code")} />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
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

          {/* Date */}
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

          {/* Opening Balance */}
          <div>
            <Label htmlFor="opening_balance">Opening Balance</Label>
            <Input
              id="opening_balance"
              type="number"
              step="0.01"
              {...register("opening_balance")}
            />
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

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? `Saving Please Wait...` : `Save Changes`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditAccountForm;
