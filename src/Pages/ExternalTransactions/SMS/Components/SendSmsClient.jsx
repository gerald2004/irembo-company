import { Button } from "@/components/ui/button";
import { useForm, Controller } from "react-hook-form";
import MessageContent from "./Forms/MessageContent";
import SimpleSelect from "./SimpleSelect";
import { useClients } from "./useClients";
// import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

const SendSmsClient = () => {
  const axiosPrivate = useAxiosPrivate();
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    reset,
  } = useForm({
    defaultValues: {
      selectedClients: [],
      message: "",
    },
    mode: "onChange",
  });

  const { data: response = [] } = useClients();

  const clients = response || [];

   const clientOptions = clients
     .map((client) => {
       return {
         value: client.client_id,
         label:
           client.client_type === "individual"
             ? `${client.client_firstname} ${client.client_lastname} (${client.client_contact})`
             : `${client.client_group_name} (${client.client_contact})`,
         phone: client.client_contact,
         ...client,
       };
     });

  const onSubmit = async (data) => {
          const controller = new AbortController();

    const recipients = data.selectedClients.map((c) => c.phone).join(", ");
    delete data.selectedClients;
    data.contacts = recipients;
    try {
      const response = await axiosPrivate.post(`/sms/selected-clients`, data, {
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
    if (errors.selectedClients) {
      toast({
        title: "Validation Error",
        variant: "destructive",
        description: "Please select at least one client",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
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
    <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-6">
      {/* Client Selection & Message Input Section */}
      <div className="space-y-6 md:col-span-6 lg:col-span-6">
        <form onSubmit={handleSubmit(onSubmit, onError)}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Client(s)</Label>

              <Controller
                name="selectedClients"
                control={control}
                rules={{ required: "Please select at least one client" }}
                render={({ field }) => (
                  <SimpleSelect
                    options={clientOptions}
                    isMulti
                    value={field.value}
                    onChange={(selected) => field.onChange(selected)}
                    placeholder="Search and select clients..."
                    closeMenuOnSelect={false}
                  />
                )}
              />

              {errors.selectedClients && (
                <p className="text-sm font-medium text-destructive">
                  {errors.selectedClients.message}
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
              <Button type="submit" disabled={Object.keys(errors).length > 0 || isSubmitting}>
                Send to Selected Clients
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* SMS Instructions Section */}
      <div className="md:col-span-6 lg:col-span-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Sending SMS Instructions</h3>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>1. Select one or more clients from the list</li>
              <li>2. Compose your message in the text area</li>
              <li>3. Keep messages under 160 characters for single SMS</li>
              <li>
                4. Click &ldquo;Send to Selected Clients&rdquo; when ready
              </li>
              <li>5. Messages are delivered immediately</li>
              <li>6. Check delivery reports in the SMS Logs</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SendSmsClient;
