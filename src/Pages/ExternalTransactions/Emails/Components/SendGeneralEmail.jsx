import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import MessageContent from "./Forms/MessageContent";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
const SendGeneralEmail = () => {
  const axiosPrivate = useAxiosPrivate();

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      subject: "",
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
      const response = await axiosPrivate.post(`/emails/branch-clients`, data, {
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
    if (errors.subject || errors.message) {
      toast({
        title: "Validation Error",
        variant: "destructive",
        description: "Please fill in all required fields",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-8 gap-6">
      {/* Email Input Section */}
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
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>

            <Controller
              name="subject"
              control={control}
              rules={{
                required: "Subject is required",
                validate: {
                  notEmpty: (value) =>
                    value.trim().length > 0 || "Subject cannot be empty",
                },
              }}
              render={({ field }) => (
                <Input
                  id="subject"
                  type="text"
                  placeholder="Enter email subject"
                  className="focus-visible focus-visible:ring-ring focus-visible:ring-offset-0 focus:outline-none"
                  {...field}
                />
              )}
            />
            {errors.subject && (
              <p className="text-sm font-medium text-destructive">
                {errors.subject.message}
              </p>
            )}
          </div>
          <Controller
            name="message"
            control={control}
            rules={{
              required: "Message is required",
              validate: {
                notEmpty: (value) =>
                  value.trim().length > 0 || "Message cannot be empty",
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
          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={Object.keys(errors).length > 0 || isSubmitting}>
              Send Email to All Clients
            </Button>
          </div>
        </form>
      </div>

      {/* Email Instructions Section */}
      <div className="md:col-span-3 lg:col-span-4">
        <Card>
          <CardHeader>
            <h3 className="font-semibold">General Email Instructions</h3>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>1. Enter an appropriate subject for the email</li>
              <li>2. Compose your email message in the text area</li>
              <li>3. This will be sent to all active clients</li>
              <li>4. Click &quot;Send Email to All Clients&quot; when ready</li>
              <li>5. Emails are delivered immediately</li>
              <li>6. Check delivery reports in the Email Logs</li>
              <li>7. Use this feature for important announcements only</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SendGeneralEmail;
