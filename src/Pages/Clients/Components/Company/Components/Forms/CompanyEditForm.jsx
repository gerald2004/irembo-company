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

const CompanyEditForm = ({ defaultValues, isLoading }) => {
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
    const detail = d.companyDetail ?? {};
    reset({
      client_firstname:           d.client_firstname ?? "",
      client_contact:             d.client_contact ?? "",
      client_email_address:       d.client_email_address ?? "",
      client_address:             d.client_address ?? "",
      client_status:              d.client_status ?? "active",
      client_extra_notes:         d.client_extra_notes ?? "",
      client_sms_status:          d.client_sms_status ?? "no",
      client_email_status:        d.client_email_status ?? "no",
      client_can_login_portal_app: d.client_can_login_portal_app ?? "no",
      company_registration_number: detail.company_registration_number ?? "",
      company_tax_id:             detail.company_tax_id ?? "",
      company_industry:           detail.company_industry ?? "",
      company_type:               detail.company_type ?? "",
      company_date_incorporated:  detail.company_date_incorporated ?? "",
      company_annual_revenue:     detail.company_annual_revenue ?? "",
      company_num_employees:      detail.company_num_employees ?? "",
      company_website:            detail.company_website ?? "",
      company_physical_address:   detail.company_physical_address ?? "",
      company_postal_address:     detail.company_postal_address ?? "",
    });
  }, [defaultValues, reset]);

  const onSubmit = async (data) => {
    const payload = {
      client_firstname:            data.client_firstname,
      client_contact:              data.client_contact,
      client_email_address:        data.client_email_address,
      client_address:              data.client_address,
      client_status:               data.client_status,
      client_extra_notes:          data.client_extra_notes,
      client_sms_status:           data.client_sms_status,
      client_email_status:         data.client_email_status,
      client_can_login_portal_app: data.client_can_login_portal_app,
      company: {
        company_registration_number: data.company_registration_number,
        company_tax_id:              data.company_tax_id,
        company_industry:            data.company_industry,
        company_type:                data.company_type,
        company_date_incorporated:   data.company_date_incorporated,
        company_annual_revenue:      data.company_annual_revenue ? Number(data.company_annual_revenue) : null,
        company_num_employees:       data.company_num_employees ? Number(data.company_num_employees) : null,
        company_website:             data.company_website,
        company_physical_address:    data.company_physical_address,
        company_postal_address:      data.company_postal_address,
      },
    };

    try {
      const res = await axiosPrivate.patch(`/clients/company/${id}`, payload);
      toast({ title: "Company updated", description: res.data.messages?.[0] });
      queryClient.invalidateQueries({ queryKey: ["company-client", id] });
      navigate(`/clients/company/${id}`);
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
      {/* Company Details */}
      <Section title="Company Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Trading / Company Name *</Label>
            <Input
              {...register("client_firstname", { required: "Company name is required" })}
              placeholder="Company name"
            />
            {errors.client_firstname && <p className="text-xs text-red-500 mt-0.5">{errors.client_firstname.message}</p>}
          </div>
          <div>
            <Label>Registration Number</Label>
            <Input {...register("company_registration_number")} placeholder="e.g. 80020001234567" />
          </div>
          <div>
            <Label>TIN / Tax ID</Label>
            <Input {...register("company_tax_id")} placeholder="Tax identification number" />
          </div>
          <div>
            <Label>Company Type</Label>
            <Controller
              name="company_type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="limited_company">Limited Liability Company</SelectItem>
                    <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="ngo">NGO / Non-Profit</SelectItem>
                    <SelectItem value="cooperative">Cooperative</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label>Industry</Label>
            <Input {...register("company_industry")} placeholder="e.g. Agriculture, Retail" />
          </div>
          <div>
            <Label>Incorporation Date</Label>
            <Input type="date" {...register("company_date_incorporated")} />
          </div>
          <div>
            <Label>Number of Employees</Label>
            <Input type="number" {...register("company_num_employees")} placeholder="e.g. 25" />
          </div>
          <div>
            <Label>Annual Revenue (UGX)</Label>
            <Input type="number" {...register("company_annual_revenue")} placeholder="e.g. 50000000" />
          </div>
          <div>
            <Label>Website</Label>
            <Input {...register("company_website")} placeholder="https://example.com" />
          </div>
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contact Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Phone / Contact *</Label>
            <Controller
              name="client_contact"
              control={control}
              rules={{ required: "Contact is required" }}
              render={({ field }) => (
                <PhoneVerifyInput
                  value={field.value ?? ""}
                  onChange={field.onChange}
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
            <Input {...register("client_address")} placeholder="Physical address" />
          </div>
          <div>
            <Label>Company Physical Address</Label>
            <Input {...register("company_physical_address")} placeholder="Company registered address" />
          </div>
          <div>
            <Label>Postal Address</Label>
            <Input {...register("company_postal_address")} placeholder="Postal / mailing address" />
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
          <div className="flex items-center justify-between border rounded-md px-4 py-3">
            <Label>Allow Portal / App Login</Label>
            <Switch
              checked={watch("client_can_login_portal_app") === "yes"}
              onCheckedChange={(v) => setValue("client_can_login_portal_app", v ? "yes" : "no")}
            />
          </div>
        </div>
      </Section>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => navigate(`/clients/company/${id}`)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};

export default CompanyEditForm;
