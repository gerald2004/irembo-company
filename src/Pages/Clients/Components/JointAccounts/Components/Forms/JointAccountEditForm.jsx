/* eslint-disable react/prop-types */
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { PhoneVerifyInput } from "@/components/PhoneVerifyInput";

const Section = ({ title, children }) => (
  <div className="border rounded-lg p-5 space-y-4">
    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
    {children}
  </div>
);

const JointAccountEditForm = ({ defaultValues, isLoading }) => {
  const axiosPrivate = useAxiosPrivate();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register, handleSubmit, setValue, watch, control, reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (!defaultValues) return;
    const d = defaultValues;
    reset({
      client_firstname:     d.client_firstname ?? "",
      client_lastname:      d.client_lastname ?? "",
      client_contact:       d.client_contact ?? "",
      client_email_address: d.client_email_address ?? "",
      client_address:       d.client_address ?? "",
      client_status:        d.client_status ?? "active",
      client_extra_notes:   d.client_extra_notes ?? "",
      client_sms_status:    d.client_sms_status ?? "no",
      client_email_status:  d.client_email_status ?? "no",
    });
  }, [defaultValues, reset]);

  const onSubmit = async (data) => {
    try {
      const res = await axiosPrivate.patch(`/clients/joint-account/${id}`, data);
      toast({ title: "Joint account updated", description: res.data.messages?.[0] });
      queryClient.invalidateQueries({ queryKey: ["joint-account-client", id] });
      navigate(`/clients/joint-account/${id}`);
    } catch (err) {
      toast({
        title: "Update failed",
        variant: "destructive",
        description: err?.response?.data?.messages?.[0] ?? "Something went wrong",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      {/* Primary Holder Info */}
      <Section title="Primary Holder Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>First Name *</Label>
            <Input
              {...register("client_firstname", { required: "First name is required" })}
              placeholder="First name"
            />
            {errors.client_firstname && <p className="text-xs text-red-500 mt-0.5">{errors.client_firstname.message}</p>}
          </div>
          <div>
            <Label>Last Name *</Label>
            <Input
              {...register("client_lastname", { required: "Last name is required" })}
              placeholder="Last name"
            />
            {errors.client_lastname && <p className="text-xs text-red-500 mt-0.5">{errors.client_lastname.message}</p>}
          </div>
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contact Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Phone / Contact</Label>
            <Controller
              name="client_contact"
              control={control}
              render={({ field }) => (
                <PhoneVerifyInput
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onAccept={(r) => {
                    setValue("client_firstname", r.firstname);
                    setValue("client_lastname", r.lastname);
                  }}
                  error={errors.client_contact?.message}
                />
              )}
            />
          </div>
          <div>
            <Label>Email Address</Label>
            <Input type="email" {...register("client_email_address")} placeholder="email@example.com" />
          </div>
          <div>
            <Label>Physical Address</Label>
            <Input {...register("client_address")} placeholder="Residential address" />
          </div>
        </div>
      </Section>

      {/* Settings */}
      <Section title="Account Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Status</Label>
            <Controller
              name="client_status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? "active"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Extra Notes</Label>
            <Textarea {...register("client_extra_notes")} placeholder="Any additional notes..." rows={3} />
          </div>
          <div className="flex items-center justify-between border rounded-md px-4 py-3">
            <Label>SMS Notifications</Label>
            <Switch
              checked={watch("client_sms_status") === "yes"}
              onCheckedChange={(v) => setValue("client_sms_status", v ? "yes" : "no")}
            />
          </div>
          <div className="flex items-center justify-between border rounded-md px-4 py-3">
            <Label>Email Notifications</Label>
            <Switch
              checked={watch("client_email_status") === "yes"}
              onCheckedChange={(v) => setValue("client_email_status", v ? "yes" : "no")}
            />
          </div>
        </div>
      </Section>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => navigate(`/clients/joint-account/${id}`)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};

export default JointAccountEditForm;
