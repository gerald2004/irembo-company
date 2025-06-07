import { Button } from "@/components/ui/button";
import { useForm, Controller } from "react-hook-form";
import MessageContent from "./Forms/MessageContent";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

const SendGeneralSms = () => {
  const axiosPrivate = useAxiosPrivate();
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      message: "",
    },
    mode: "onChange",
  });
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
            const controller = new AbortController();

      const response = await axiosPrivate.get(`/settings/branches`, {
        signal: controller.signal,
      }); // ✅ Change API endpoint as needed
      return response.data?.data?.branches || [];
    },
  });
  const onSubmit = async (data) => {
          const controller = new AbortController();

    try {
      const response = await axiosPrivate.post(`/sms/branch-clients`, data, {
        signal: controller.signal,
      });
      toast({
        title: "Success",
        description: response.data.messages,
      });
      reset();
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

  const onError = (errors) => {
    if (errors.message) {
      toast({
        title: "Validation Error",
        variant: "destructive",
        description: errors.message.message || "Please enter a valid message",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-8 gap-6">
      {/* Message Input Section */}
      <div className="space-y-6 md:col-span-3 lg:col-span-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm">
              This message will be sent to all (branch) clients in the system.
            </p>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit(onSubmit, onError)}>
          <div className="col-span-full">
            <Label htmlFor="branch">Select Branch</Label>
            <Controller
              name="branch"
              control={control}
              rules={{ required: "Branch is required" }}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={isLoading ? "Loading..." : "Select branch"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={"all"}>{"All Branches"}</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.name} ({branch.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.branch && (
              <p className="text-red-500 text-sm">{errors.branch.message}</p>
            )}
          </div>
          <div className="space-y-4 py-3">
            <Controller
              name="message"
              control={control}
              rules={{
                required: "Message is required",
                validate: {
                  notEmpty: (value) =>
                    value.trim().length > 0 || "Message cannot be empty",
                  notTooLong: (value) =>
                    value.length <= 480 ||
                    "Message is too long (max 480 characters)",
                },
              }}
              render={({ field }) => (
                <MessageContent
                  message={field.value}
                  setMessage={field.onChange}
                  error={errors.message}
                />
              )}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={Object.keys(errors).length > 0 || isSubmitting}
              >
                Send to All Clients
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* SMS Instructions Section */}
      <div className="md:col-span-3 lg:col-span-4">
        <Card>
          <CardHeader>
            <h3 className="font-semibold">General SMS Instructions</h3>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>1. Compose your message in the text area</li>
              <li>2. Keep messages under 160 characters for single SMS</li>
              <li>3. This will be sent to all (branch) active clients</li>
              <li>
                4. Click &quot;Send to All (branch) Clients&quot; when ready
              </li>
              <li>5. Messages are delivered immediately</li>
              <li>6. Check delivery reports in the SMS Logs</li>
              <li>7. Use this feature sparingly for important announcements</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SendGeneralSms;
