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
  Users2,
  Phone,
  UserPlus,
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

const JointAccountRegistrationForm = () => {
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

  const { fields, append, remove } = useFieldArray({ control, name: "holders" });

  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState(null);
  const TOTAL_STEPS = 5;

  const STEP_FIELDS = {
    1: ["client_firstname", "client_lastname", "client_date_of_birth", "client_gender", "client_identification"],
    2: ["client_contact", "client_address"],
    4: ["client_status", "client_date_of_join"],
    5: [],
  };

  const validateStep = async () => {
    let fieldsToValidate;
    if (step === 3) {
      fieldsToValidate = fields.flatMap((_, i) => [
        `holders.${i}.holder_firstname`,
        `holders.${i}.holder_lastname`,
        `holders.${i}.holder_identification`,
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

  const uploadPhoto = async (file, clientId) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("file_type", "passport");
    fd.append("client_id", clientId);
    try {
      await axiosPrivate.post("clients/images", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (err) {
      console.error("Photo upload failed", err);
    }
  };

  const onSubmit = async (data) => {
    if (!data.holders || data.holders.length < 1) {
      toast({
        title: "Validation Error",
        variant: "destructive",
        description: "At least one additional holder is required.",
      });
      return;
    }
    try {
      const response = await axiosPrivate.post("/clients/joint-account", data);
      const clientId = response.data.data.client.client_id;

      if (data.user_image instanceof File) {
        await uploadPhoto(data.user_image, clientId);
      }

      toast({ title: "Success", description: response?.data?.messages?.[0] });
      reset();
      setStep(1);
      navigate(`/clients/joint-account/${clientId}`);
    } catch (error) {
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: error?.response?.data?.messages || "No server response",
      });
    }
  };

  const stepIcons = [
    { icon: <Users2 className="w-6 h-6 text-blue-500" />, label: "Primary Holder" },
    { icon: <Phone className="w-6 h-6 text-red-500" />, label: "Contact" },
    { icon: <UserPlus className="w-6 h-6 text-orange-500" />, label: "Additional Holders" },
    { icon: <Cog className="w-6 h-6 text-yellow-500" />, label: "Settings" },
    { icon: <Image className="w-6 h-6 text-green-500" />, label: "Photo" },
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

          {/* Step 1 — Primary Holder Bio */}
          {step === 1 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <p className="md:col-span-3 text-muted-foreground text-xs">
                Enter details of the primary account holder.
              </p>

              <div>
                <Label>First Name</Label>
                <Input
                  placeholder="Enter first name"
                  {...register("client_firstname", { required: "First name is required" })}
                />
                {errors.client_firstname && (
                  <p className="text-red-500 text-sm">{errors.client_firstname.message}</p>
                )}
              </div>

              <div>
                <Label>Middle Name</Label>
                <Input placeholder="Enter middle name" {...register("client_middlename")} />
              </div>

              <div>
                <Label>Last Name</Label>
                <Input
                  placeholder="Enter last name"
                  {...register("client_lastname", { required: "Last name is required" })}
                />
                {errors.client_lastname && (
                  <p className="text-red-500 text-sm">{errors.client_lastname.message}</p>
                )}
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
                {errors.client_date_of_birth && (
                  <p className="text-red-500 text-sm">{errors.client_date_of_birth.message}</p>
                )}
              </div>

              <div>
                <Label>Gender</Label>
                <Controller
                  name="client_gender"
                  control={control}
                  rules={{ required: "Gender is required" }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.client_gender && (
                  <p className="text-red-500 text-sm">{errors.client_gender.message}</p>
                )}
              </div>

              <div className="md:col-span-3">
                <Label>Identification (National ID)</Label>
                <Controller
                  name="client_identification"
                  control={control}
                  rules={{ required: "Identification is required" }}
                  render={({ field }) => (
                    <NINVerifyInput
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onAccept={(v) => {
                        if (v.name) {
                          const parts = v.name.trim().split(/\s+/);
                          setValue("client_firstname", parts[0] ?? "");
                          setValue("client_lastname", parts[1] ?? "");
                          if (parts[2]) setValue("client_middlename", parts[2]);
                        }
                        if (v.date_of_birth) setValue("client_date_of_birth", v.date_of_birth);
                        toast({ title: "Applied", description: "Name and DOB pre-filled from NIN record." });
                      }}
                      error={errors.client_identification?.message}
                    />
                  )}
                />
              </div>

              <div>
                <Label>Primary Ownership %</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue={50}
                  placeholder="e.g. 50"
                  {...register("primary_ownership_pct")}
                />
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

              <div className="md:col-span-2">
                <Label>Address</Label>
                <Textarea
                  placeholder="Enter residential address"
                  {...register("client_address", { required: "Address is required" })}
                />
                {errors.client_address && (
                  <p className="text-red-500 text-sm">{errors.client_address.message}</p>
                )}
              </div>
            </fieldset>
          )}

          {/* Step 3 — Additional Holders */}
          {step === 3 && (
            <fieldset className="space-y-4">
              <p className="text-muted-foreground text-xs">
                Add at least one additional account holder. Each holder must have a unique identification.
              </p>

              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-md relative">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      placeholder="First name"
                      {...register(`holders.${index}.holder_firstname`, { required: "Required" })}
                    />
                    {errors.holders?.[index]?.holder_firstname && (
                      <p className="text-red-500 text-sm">{errors.holders[index].holder_firstname.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>Middle Name</Label>
                    <Input placeholder="Middle name" {...register(`holders.${index}.holder_middlename`)} />
                  </div>

                  <div>
                    <Label>Last Name</Label>
                    <Input
                      placeholder="Last name"
                      {...register(`holders.${index}.holder_lastname`, { required: "Required" })}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label>Identification (National ID)</Label>
                    <Controller
                      name={`holders.${index}.holder_identification`}
                      control={control}
                      rules={{ required: "Required" }}
                      render={({ field }) => (
                        <NINVerifyInput
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onAccept={(v) => {
                            if (v.name) {
                              const parts = v.name.trim().split(/\s+/);
                              setValue(`holders.${index}.holder_firstname`, parts[0] ?? "");
                              setValue(`holders.${index}.holder_lastname`, parts[1] ?? "");
                              if (parts[2]) setValue(`holders.${index}.holder_middlename`, parts[2]);
                            }
                            if (v.date_of_birth) setValue(`holders.${index}.holder_date_of_birth`, v.date_of_birth);
                            toast({ title: "Applied", description: `Holder ${index + 1} details pre-filled from NIN record.` });
                          }}
                          error={errors.holders?.[index]?.holder_identification?.message}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Date of Birth</Label>
                    <Controller
                      name={`holders.${index}.holder_date_of_birth`}
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
                    <Label>Gender</Label>
                    <Controller
                      name={`holders.${index}.holder_gender`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <Label>Contact</Label>
                    <Controller
                      name={`holders.${index}.holder_contact`}
                      control={control}
                      render={({ field }) => (
                        <PhoneVerifyInput
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onAccept={(r) => {
                            setValue(`holders.${index}.holder_firstname`, r.firstname);
                            setValue(`holders.${index}.holder_lastname`, r.lastname);
                          }}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input type="email" placeholder="Email" {...register(`holders.${index}.holder_email`)} />
                  </div>

                  <div>
                    <Label>Relationship to Primary</Label>
                    <Controller
                      name={`holders.${index}.holder_relationship`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="sibling">Sibling</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="business_partner">Business Partner</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
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
                      defaultValue={50}
                      placeholder="e.g. 50"
                      {...register(`holders.${index}.ownership_percentage`)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Address</Label>
                    <Input placeholder="Residential address" {...register(`holders.${index}.holder_address`)} />
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
                  holder_firstname: "", holder_middlename: "", holder_lastname: "",
                  holder_identification: "", holder_date_of_birth: "", holder_gender: "",
                  holder_contact: "", holder_email: "", holder_relationship: "other",
                  ownership_percentage: 50, holder_address: "",
                })}
              >
                <PlusCircle className="w-4 h-4 mr-2" /> Add Holder
              </Button>

              {fields.length === 0 && (
                <p className="text-amber-600 text-xs">
                  You must add at least one additional holder before submitting.
                </p>
              )}
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
                <Textarea placeholder="Any additional notes..." {...register("client_extra_notes")} />
              </div>
            </fieldset>
          )}

          {/* Step 5 — Photo */}
          {step === 5 && (
            <fieldset className="grid grid-cols-1 gap-4">
              <div className="flex flex-col items-center space-y-2">
                <Label className="text-center">Primary Holder Photo (optional)</Label>
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
                    <span className="text-gray-400 text-xs text-center">No Photo</span>
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  {...register("user_image")}
                  className="hidden"
                  id="photo-upload"
                  onChange={handleFileChange}
                />
                <Button asChild variant="outline" className="w-full">
                  <label htmlFor="photo-upload" className="cursor-pointer flex items-center gap-2">
                    <UploadIcon className="w-5 h-5 text-gray-600" />
                    Upload Photo
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

export default JointAccountRegistrationForm;
