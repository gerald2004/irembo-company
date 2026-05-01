import { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
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
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  ArrowLeft,
  UploadIcon,
  XCircle,
  Building2,
  Phone,
  Users,
  Cog,
  Image,
  CheckCircle,
  PlusCircle,
  Trash,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { NINVerifyInput } from "@/components/NINVerifyInput";
import { PhoneVerifyInput } from "@/components/PhoneVerifyInput";

const today = new Date().toLocaleDateString("en-CA");

const CompanyRegistrationForm = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    control,
    trigger,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      client_date_of_join: today,
      client_status: "active",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "directors" });

  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState(null);
  const TOTAL_STEPS = 5;

  const STEP_FIELDS = {
    1: ["client_firstname", "company_registration_number"],
    2: ["client_contact", "client_address"],
    4: ["client_status", "client_date_of_join"],
    5: [],
  };

  const validateStep = async () => {
    let fieldsToValidate;
    if (step === 3) {
      fieldsToValidate = fields.flatMap((_, i) => [
        `directors.${i}.director_firstname`,
        `directors.${i}.director_lastname`,
        `directors.${i}.director_identification`,
      ]);
    } else {
      fieldsToValidate = STEP_FIELDS[step] ?? [];
    }
    const valid = await trigger(fieldsToValidate);
    if (valid && step < TOTAL_STEPS) setStep((p) => p + 1);
  };
  const prevStep = () => setStep((p) => Math.max(p - 1, 1));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setValue("user_image", file);
    }
  };
  const handleRemoveImage = () => {
    setPreview(null);
    setValue("user_image", null);
  };

  const uploadLogo = async (file, clientId) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("file_type", "passport");
    fd.append("client_id", clientId);
    try {
      await axiosPrivate.post("clients/images", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (err) {
      console.error("Logo upload failed", err);
    }
  };

  const onSubmit = async (data) => {
    try {
      const response = await axiosPrivate.post("/clients/company", data);
      const clientId = response.data.data.client.client_id;

      if (data.user_image instanceof File) {
        await uploadLogo(data.user_image, clientId);
      }

      toast({ title: "Success", description: response?.data?.messages?.[0] });
      reset();
      setStep(1);
      navigate(`/clients/company/${clientId}`);
    } catch (error) {
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: error?.response?.data?.messages || "No server response",
      });
    }
  };

  const stepIcons = [
    { icon: <Building2 className="w-6 h-6 text-blue-500" />, label: "Company Details" },
    { icon: <Phone className="w-6 h-6 text-red-500" />, label: "Contact" },
    { icon: <Users className="w-6 h-6 text-orange-500" />, label: "Directors" },
    { icon: <Cog className="w-6 h-6 text-yellow-500" />, label: "Settings" },
    { icon: <Image className="w-6 h-6 text-green-500" />, label: "Logo" },
  ];

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader className="p-4 rounded-t-xl">
        <CardTitle className="text-sm font-semibold">
          <div className="flex items-center space-x-4 my-1 flex-wrap gap-y-2">
            {stepIcons.map((s, i) => (
              <div
                key={i}
                className={`flex items-center ${step > i + 1 ? "opacity-100" : "opacity-50"} transition-opacity`}
              >
                {s.icon}
                <span className="ml-2 text-sm font-medium">{s.label}</span>
                {i < stepIcons.length - 1 && (
                  <div className="h-[2px] w-8 bg-gray-300 mx-2" />
                )}
              </div>
            ))}
          </div>
        </CardTitle>
        <div className="border-b" />
        <CardDescription>
          <Progress value={(step / TOTAL_STEPS) * 100} className="my-1" />
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 space-y-4 text-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" encType="multipart/form-data">

          {/* Step 1 — Company Details */}
          {step === 1 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Trading / Company Name</Label>
                <Input
                  placeholder="Enter trading name"
                  {...register("client_firstname", { required: "Company name is required" })}
                />
                {errors.client_firstname && (
                  <p className="text-red-500 text-sm">{errors.client_firstname.message}</p>
                )}
              </div>

              <div>
                <Label>Registration Number</Label>
                <Input
                  placeholder="e.g. 80020001234567"
                  {...register("company_registration_number", { required: "Registration number is required" })}
                />
                {errors.company_registration_number && (
                  <p className="text-red-500 text-sm">{errors.company_registration_number.message}</p>
                )}
              </div>

              <div>
                <Label>Tax / TIN Number</Label>
                <Input
                  placeholder="Enter TIN number"
                  {...register("tax_identification_number")}
                />
              </div>

              <div>
                <Label>Company Type</Label>
                <Controller
                  name="company_type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
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
                <Input placeholder="e.g. Agriculture, Retail" {...register("industry")} />
              </div>

              <div>
                <Label>Incorporation Date</Label>
                <Controller
                  name="incorporation_date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      selectedDate={field.value ? new Date(field.value) : null}
                      onChange={(d) => d && field.onChange(d.toLocaleDateString("en-CA"))}
                    />
                  )}
                />
              </div>

              <div>
                <Label>Number of Employees</Label>
                <Input type="number" placeholder="e.g. 25" {...register("number_of_employees")} />
              </div>

              <div>
                <Label>Annual Revenue (UGX)</Label>
                <Input type="number" placeholder="e.g. 50000000" {...register("annual_revenue")} />
              </div>
            </fieldset>
          )}

          {/* Step 2 — Contact */}
          {step === 2 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Contact / Phone</Label>
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
                <Input
                  type="email"
                  placeholder="Enter email address"
                  {...register("client_email_address", {
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" },
                  })}
                />
                {errors.client_email_address && (
                  <p className="text-red-500 text-sm">{errors.client_email_address.message}</p>
                )}
              </div>

              <div>
                <Label>Website</Label>
                <Input placeholder="https://example.com" {...register("website")} />
              </div>

              <div className="md:col-span-2">
                <Label>Physical Address</Label>
                <Textarea
                  placeholder="Enter company physical address"
                  {...register("client_address", { required: "Address is required" })}
                />
                {errors.client_address && (
                  <p className="text-red-500 text-sm">{errors.client_address.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label>Postal Address</Label>
                <Textarea placeholder="Enter postal / mailing address" {...register("postal_address")} />
              </div>
            </fieldset>
          )}

          {/* Step 3 — Directors */}
          {step === 3 && (
            <fieldset className="space-y-4">
              <p className="text-muted-foreground text-xs">Add company directors and authorized signatories.</p>
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-md relative">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      placeholder="First name"
                      {...register(`directors.${index}.director_firstname`, { required: "Required" })}
                    />
                    {errors.directors?.[index]?.director_firstname && (
                      <p className="text-red-500 text-sm">{errors.directors[index].director_firstname.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>Last Name</Label>
                    <Input
                      placeholder="Last name"
                      {...register(`directors.${index}.director_lastname`, { required: "Required" })}
                    />
                    {errors.directors?.[index]?.director_lastname && (
                      <p className="text-red-500 text-sm">{errors.directors[index].director_lastname.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <Label>Identification (National ID)</Label>
                    <Controller
                      name={`directors.${index}.director_identification`}
                      control={control}
                      rules={{ required: "Required" }}
                      render={({ field }) => (
                        <NINVerifyInput
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onAccept={(v) => {
                            if (v.name) {
                              const parts = v.name.trim().split(/\s+/);
                              setValue(`directors.${index}.director_firstname`, parts[0] ?? "");
                              setValue(`directors.${index}.director_lastname`, parts[1] ?? "");
                            }
                            toast({ title: "Applied", description: `Director ${index + 1} name pre-filled from NIN record.` });
                          }}
                          error={errors.directors?.[index]?.director_identification?.message}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Contact</Label>
                    <Controller
                      name={`directors.${index}.director_contact`}
                      control={control}
                      render={({ field }) => (
                        <PhoneVerifyInput
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input type="email" placeholder="Email" {...register(`directors.${index}.director_email`)} />
                  </div>

                  <div>
                    <Label>Nationality</Label>
                    <Input placeholder="e.g. Ugandan" {...register(`directors.${index}.director_nationality`)} />
                  </div>

                  <div>
                    <Label>Role / Title</Label>
                    <Controller
                      name={`directors.${index}.director_role`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ceo">CEO / Managing Director</SelectItem>
                            <SelectItem value="director">Director</SelectItem>
                            <SelectItem value="chairman">Chairman</SelectItem>
                            <SelectItem value="secretary">Company Secretary</SelectItem>
                            <SelectItem value="shareholder">Major Shareholder</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <Label>Ownership %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="e.g. 50"
                      {...register(`directors.${index}.ownership_percentage`)}
                    />
                  </div>

                  <div className="flex items-center space-x-3 mt-5">
                    <Switch
                      checked={watch(`directors.${index}.is_authorized_signatory`) === 1}
                      onCheckedChange={(c) => setValue(`directors.${index}.is_authorized_signatory`, c ? 1 : 0)}
                    />
                    <Label>Authorized Signatory</Label>
                  </div>

                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    className="absolute top-2 right-2 text-red-500"
                    onClick={() => remove(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({
                  director_firstname: "", director_lastname: "", director_identification: "",
                  director_contact: "", director_email: "", director_nationality: "",
                  director_role: "", ownership_percentage: "", is_authorized_signatory: 0,
                })}
              >
                <PlusCircle className="w-4 h-4 mr-2" /> Add Director
              </Button>
            </fieldset>
          )}

          {/* Step 4 — Settings */}
          {step === 4 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Controller
                  name="client_status"
                  control={control}
                  rules={{ required: "Status is required" }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.client_status && (
                  <p className="text-red-500 text-sm">{errors.client_status.message}</p>
                )}
              </div>

              <div>
                <Label>Date of Registration / Joining</Label>
                <Controller
                  name="client_date_of_join"
                  control={control}
                  rules={{ required: "Date of joining is required" }}
                  render={({ field }) => (
                    <DatePicker
                      selectedDate={field.value ? new Date(field.value) : new Date()}
                      onChange={(d) => d && field.onChange(d.toLocaleDateString("en-CA"))}
                    />
                  )}
                />
                {errors.client_date_of_join && (
                  <p className="text-red-500 text-sm">{errors.client_date_of_join.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  checked={watch("client_mobile_banking_status") === "yes"}
                  onCheckedChange={(c) => setValue("client_mobile_banking_status", c ? "yes" : "no")}
                />
                <Label>Enable Mobile Banking</Label>
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  checked={watch("client_can_login_portal_app") === "yes"}
                  onCheckedChange={(c) => setValue("client_can_login_portal_app", c ? "yes" : "no")}
                />
                <Label>Allow Login to Portal/App</Label>
              </div>

              <div className="md:col-span-2">
                <Label>Extra Notes</Label>
                <Textarea placeholder="Any additional notes about this company..." {...register("client_extra_notes")} />
              </div>
            </fieldset>
          )}

          {/* Step 5 — Logo */}
          {step === 5 && (
            <fieldset className="grid grid-cols-1 gap-4">
              <div className="flex flex-col items-center space-y-2">
                <Label className="text-center">Company Logo (optional)</Label>
                <div className="relative w-32 h-32 border border-gray-300 rounded-full overflow-hidden flex items-center justify-center">
                  {preview ? (
                    <>
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-2 right-4 bg-red-500 text-white p-1 rounded-full z-10"
                        onClick={handleRemoveImage}
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-400 text-xs text-center">No Logo</span>
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  {...register("user_image")}
                  className="hidden"
                  id="logo-upload"
                  onChange={handleFileChange}
                />
                <Button asChild variant="outline" className="w-full">
                  <label htmlFor="logo-upload" className="cursor-pointer flex items-center gap-2">
                    <UploadIcon className="w-5 h-5 text-gray-600" />
                    Upload Logo
                  </label>
                </Button>
              </div>
            </fieldset>
          )}

          <CardFooter>
            <div className="flex justify-end w-full gap-2">
              {step > 1 && (
                <Button type="button" variant="secondary" onClick={prevStep}>
                  <ArrowLeft className="mr-2" /> Back
                </Button>
              )}
              {step < TOTAL_STEPS && (
                <Button type="button" onClick={validateStep}>
                  Next <ArrowRight className="ml-2" />
                </Button>
              )}
              {step === TOTAL_STEPS && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : <><CheckCircle className="mr-2" /> Submit</>}
                </Button>
              )}
            </div>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
};

export default CompanyRegistrationForm;
