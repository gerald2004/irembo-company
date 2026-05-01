import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
  Fingerprint,
  Cog,
  Image,
  CheckCircle,
  Phone,
  IdCard,
  BookDashed,
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

// Fields required per step — only these are validated before advancing
const STEP_FIELDS = {
  1: ["client_firstname", "client_lastname", "client_date_of_birth", "client_gender", "client_martial_status"],
  2: ["client_identification"],
  3: ["client_contact", "client_address"],
  4: ["client_employment_status"],
  5: ["client_status", "client_date_of_join"],
  6: [],
};

const ClientRegistrationForm = () => {
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

  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState(null);


  // Only validate fields for the current step
  const validateStep = async () => {
    const fields = STEP_FIELDS[step] ?? [];
    const valid = await trigger(fields);
    if (valid && step < 6) setStep((p) => p + 1);
  };
  const prevStep = () => setStep((p) => Math.max(p - 1, 1));

  // Accept NIN verification data → pre-fill bio fields on step 1
  const handleAcceptNIN = (v) => {
    if (v.name) {
      const parts = v.name.trim().split(/\s+/);
      setValue("client_firstname", parts[0] ?? "");
      setValue("client_lastname", parts[1] ?? "");
      if (parts[2]) setValue("client_middlename", parts[2]);
    }
    if (v.date_of_birth) setValue("client_date_of_birth", v.date_of_birth);
    toast({ title: "Applied", description: "Name and DOB pre-filled from NIN record." });
  };


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

  const onSubmit = async (data) => {
    try {
      const response = await axiosPrivate.post("/clients/individual", data);
      const clientId = response.data.data.client.client_id;

      if (data.user_image instanceof File) {
        const fd = new FormData();
        fd.append("file", data.user_image);
        fd.append("file_type", "passport");
        fd.append("client_id", clientId);
        await axiosPrivate.post("clients/images", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      toast({ title: "Success", description: response?.data?.messages?.[0] });
      reset();
      setStep(1);
      navigate(`/clients/individual/${clientId}`);
    } catch (error) {
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: error?.response?.data?.messages || "No server response",
      });
    }
  };

  const stepIcons = [
    { icon: <Fingerprint className="w-5 h-5 text-blue-500" />,   label: "Bio Details" },
    { icon: <IdCard className="w-5 h-5 text-orange-500" />,       label: "Identification" },
    { icon: <Phone className="w-5 h-5 text-red-500" />,           label: "Contact" },
    { icon: <BookDashed className="w-5 h-5 text-purple-500" />,   label: "Employment" },
    { icon: <Cog className="w-5 h-5 text-yellow-500" />,          label: "Settings" },
    { icon: <Image className="w-5 h-5 text-green-500" />,         label: "Photo" },
  ];

  const employmentStatus = watch("client_employment_status");

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader className="p-4 rounded-t-xl">
        <CardTitle className="text-sm font-semibold">
          <div className="flex items-center my-1 flex-wrap gap-x-3 gap-y-2">
            {stepIcons.map((s, i) => (
              <div key={i} className={`flex items-center ${step > i + 1 ? "opacity-100" : "opacity-50"} transition-opacity`}>
                {s.icon}
                <span className="ml-1.5 text-xs font-medium">{s.label}</span>
                {i < stepIcons.length - 1 && <div className="h-[2px] w-5 bg-gray-300 mx-2" />}
              </div>
            ))}
          </div>
        </CardTitle>
        <div className="border-b" />
        <CardDescription>
          <Progress value={(step / 6) * 100} className="my-1" />
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 space-y-4 text-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" encType="multipart/form-data">

          {/* ─── Step 1: Bio ─────────────────────────────────── */}
          {step === 1 && (
            <fieldset className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label>First Name</Label>
                <Input placeholder="Enter first name" {...register("client_firstname", { required: "First name is required" })} />
                {errors.client_firstname && <p className="text-red-500 text-xs mt-1">{errors.client_firstname.message}</p>}
              </div>
              <div>
                <Label>Middle Name</Label>
                <Input placeholder="Enter middle name" {...register("client_middlename")} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input placeholder="Enter last name" {...register("client_lastname", { required: "Last name is required" })} />
                {errors.client_lastname && <p className="text-red-500 text-xs mt-1">{errors.client_lastname.message}</p>}
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Controller
                  name="client_date_of_birth"
                  control={control}
                  rules={{ required: "Date of birth is required" }}
                  render={({ field }) => (
                    <DatePicker
                      selectedDate={field.value ? new Date(field.value) : null}
                      onChange={(d) => d && field.onChange(d.toLocaleDateString("en-CA"))}
                    />
                  )}
                />
                {errors.client_date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.client_date_of_birth.message}</p>}
              </div>
              <div>
                <Label>Gender</Label>
                <Controller
                  name="client_gender"
                  control={control}
                  rules={{ required: "Gender is required" }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.client_gender && <p className="text-red-500 text-xs mt-1">{errors.client_gender.message}</p>}
              </div>
              <div>
                <Label>Marital Status</Label>
                <Controller
                  name="client_martial_status"
                  control={control}
                  rules={{ required: "Marital status is required" }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <SelectTrigger><SelectValue placeholder="Select marital status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.client_martial_status && <p className="text-red-500 text-xs mt-1">{errors.client_martial_status.message}</p>}
              </div>
            </fieldset>
          )}

          {/* ─── Step 2: Identification + NIN Verify ─────────── */}
          {step === 2 && (
            <fieldset className="space-y-4">
              <div>
                <Label>National ID / Passport Number</Label>
                <Controller
                  name="client_identification"
                  control={control}
                  rules={{ required: "Identification is required" }}
                  render={({ field }) => (
                    <NINVerifyInput
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onAccept={handleAcceptNIN}
                      error={errors.client_identification?.message}
                    />
                  )}
                />
              </div>
            </fieldset>
          )}

          {/* ─── Step 3: Contact ─────────────────────────────── */}
          {step === 3 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  {...register("client_email_address", {
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email address" },
                  })}
                />
                {errors.client_email_address && <p className="text-red-500 text-xs mt-1">{errors.client_email_address.message}</p>}
              </div>
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
                      onAccept={(r) => {
                        setValue("client_firstname", r.firstname);
                        setValue("client_lastname", r.lastname);
                      }}
                      error={errors.client_contact?.message}
                    />
                  )}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Residential Address</Label>
                <Textarea
                  placeholder="Enter residential address"
                  {...register("client_address", { required: "Address is required" })}
                />
                {errors.client_address && <p className="text-red-500 text-xs mt-1">{errors.client_address.message}</p>}
              </div>
            </fieldset>
          )}

          {/* ─── Step 4: Employment ──────────────────────────── */}
          {step === 4 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Employment Status</Label>
                <Controller
                  name="client_employment_status"
                  control={control}
                  rules={{ required: "Employment status is required" }}
                  render={({ field }) => (
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        setValue("client_extra_notes", "");
                      }}
                      value={field.value ?? ""}
                    >
                      <SelectTrigger><SelectValue placeholder="Select employment status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employed">Employed</SelectItem>
                        <SelectItem value="unemployed">Unemployed</SelectItem>
                        <SelectItem value="selfemployed">Self-Employed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.client_employment_status && <p className="text-red-500 text-xs mt-1">{errors.client_employment_status.message}</p>}
              </div>

              {employmentStatus === "employed" && (
                <>
                  <div>
                    <Label>Estimated Gross Income</Label>
                    <Input
                      type="number"
                      placeholder="Enter gross income"
                      {...register("client_estimated_gross", { required: "Gross income is required" })}
                    />
                    {errors.client_estimated_gross && <p className="text-red-500 text-xs mt-1">{errors.client_estimated_gross.message}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <Label>Employer &amp; Location Details</Label>
                    <Textarea
                      placeholder="Describe employer, location, and other details..."
                      {...register("client_extra_notes", { required: "This field is required" })}
                    />
                    {errors.client_extra_notes && <p className="text-red-500 text-xs mt-1">{errors.client_extra_notes.message}</p>}
                  </div>
                </>
              )}

              {(employmentStatus === "unemployed" || employmentStatus === "selfemployed") && (
                <div className="md:col-span-2">
                  <Label>
                    {employmentStatus === "unemployed" ? "Source of Income" : "Business Details &amp; Income Source"}
                  </Label>
                  <Textarea
                    placeholder={
                      employmentStatus === "unemployed"
                        ? "Explain income source while unemployed..."
                        : "Enter business name, type, and income sources..."
                    }
                    {...register("client_extra_notes", { required: "This field is required" })}
                  />
                  {errors.client_extra_notes && <p className="text-red-500 text-xs mt-1">{errors.client_extra_notes.message}</p>}
                </div>
              )}
            </fieldset>
          )}

          {/* ─── Step 5: Settings ────────────────────────────── */}
          {step === 5 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Controller
                  name="client_status"
                  control={control}
                  rules={{ required: "Status is required" }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? "active"}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.client_status && <p className="text-red-500 text-xs mt-1">{errors.client_status.message}</p>}
              </div>

              <div>
                <Label>Date of Joining</Label>
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
                {errors.client_date_of_join && <p className="text-red-500 text-xs mt-1">{errors.client_date_of_join.message}</p>}
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
            </fieldset>
          )}

          {/* ─── Step 6: Photo ───────────────────────────────── */}
          {step === 6 && (
            <fieldset className="grid grid-cols-1 gap-4">
              <div className="flex flex-col items-center space-y-2">
                <Label className="text-center">Profile Picture (optional)</Label>
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
                    <span className="text-gray-400 text-xs">No Image</span>
                  )}
                </div>
                <Input type="file" accept="image/*" {...register("user_image")} className="hidden" id="file-upload" onChange={handleFileChange} />
                <Button asChild variant="outline" className="w-full">
                  <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-2">
                    <UploadIcon className="w-5 h-5 text-gray-600" /> Upload Image
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
              {step < 6 && (
                <Button type="button" onClick={validateStep}>
                  Next <ArrowRight className="ml-2" />
                </Button>
              )}
              {step === 6 && (
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

export default ClientRegistrationForm;
