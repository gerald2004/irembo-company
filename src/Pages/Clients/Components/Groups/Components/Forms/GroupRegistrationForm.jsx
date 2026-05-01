import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookUser, Search, UserCheck, Trash2, X } from "lucide-react";
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
  Cog,
  Image,
  CheckCircle,
  CalendarIcon,
  Phone,
  IdCard,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { PhoneVerifyInput } from "@/components/PhoneVerifyInput";

const EXECUTIVE_ROLES = [
  { value: "chairperson", label: "Chairperson" },
  { value: "vice_chairperson", label: "Vice Chairperson" },
  { value: "secretary", label: "Secretary" },
  { value: "treasurer", label: "Treasurer" },
  { value: "patron", label: "Patron" },
  { value: "other", label: "Other Officer" },
];

const GroupRegistrationForm = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("en-CA");

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
      group_date_of_join: today,
      client_status: "active",
    },
  });

  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState(null);

  // Executive search state (step 4)
  const [execSearch, setExecSearch] = useState("");
  const [execResults, setExecResults] = useState([]);
  const [execSearching, setExecSearching] = useState(false);
  const [executives, setExecutives] = useState([]); // [{client, role}]

  const STEP_FIELDS = {
    1: ["group_name"],
    2: ["client_contact", "client_address"],
    3: ["client_status", "group_date_of_join"],
  };

  const validateStep = async () => {
    if (step === 4) {
      // Validate each executive has a role selected
      const missingRole = executives.some((e) => !e.role);
      if (missingRole) {
        toast({ title: "Assign a role to every executive before continuing.", variant: "destructive" });
        return;
      }
      setStep(5);
      return;
    }
    const valid = await trigger(STEP_FIELDS[step] ?? []);
    if (valid && step < 5) setStep((prev) => prev + 1);
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // ── Executive search ──
  const handleExecSearch = async () => {
    if (!execSearch.trim()) return;
    setExecSearching(true);
    setExecResults([]);
    try {
      const res = await axiosPrivate.get(`/clients/individual?search=${encodeURIComponent(execSearch)}`);
      setExecResults(res.data.data?.clients ?? []);
    } catch {
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setExecSearching(false);
    }
  };

  const addExecutive = (client) => {
    if (executives.find((e) => e.client.client_id === client.client_id)) {
      toast({ title: "Already added", description: `${client.client_firstname} ${client.client_lastname} is already in the list.` });
      return;
    }
    setExecutives((prev) => [...prev, { client, role: "" }]);
    setExecResults([]);
    setExecSearch("");
  };

  const removeExecutive = (clientId) => {
    setExecutives((prev) => prev.filter((e) => e.client.client_id !== clientId));
  };

  const setExecRole = (clientId, role) => {
    setExecutives((prev) =>
      prev.map((e) => e.client.client_id === clientId ? { ...e, role } : e)
    );
  };

  // ── Image ──
  const handleImageChange = (e) => {
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

  const uploadClientImage = async (file, clientId) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("file_type", "passport");
    fd.append("client_id", clientId);
    try {
      await axiosPrivate.post("clients/images", fd, { headers: { "Content-Type": "multipart/form-data" } });
    } catch {
      // non-fatal
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        executives: executives.map((e) => ({
          member_client_id: e.client.client_id,
          role: e.role,
        })),
      };

      const response = await axiosPrivate.post("/clients/groups", payload);
      const clientId = response.data.data.client_id;

      if (data.user_image instanceof File) {
        await uploadClientImage(data.user_image, clientId);
      }

      toast({ title: "Success", description: response?.data?.messages?.[0] });
      reset();
      setExecutives([]);
      setStep(1);
      navigate(`/clients/group/${clientId}`);
    } catch (error) {
      toast({
        title: "Something went wrong.",
        variant: "destructive",
        description: error?.response?.data?.messages || "No server response",
      });
    }
  };

  const stepIcons = [
    { icon: <BookUser className="w-6 h-6 text-blue-500" />, label: "Details" },
    { icon: <Phone className="w-6 h-6 text-red-500" />, label: "Contact" },
    { icon: <Cog className="w-6 h-6 text-yellow-500" />, label: "Settings" },
    { icon: <IdCard className="w-6 h-6 text-orange-500" />, label: "Executives" },
    { icon: <Image className="w-6 h-6 text-green-500" />, label: "Group Photo" },
  ];

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader className="p-4 rounded-t-xl">
        <CardTitle className="text-sm font-semibold">
          <div className="flex items-end space-x-4 my-1">
            {stepIcons.map((stepIcon, index) => (
              <div
                key={index}
                className={`flex items-center ${step > index + 1 ? "opacity-100" : "opacity-50"} transition-opacity`}
              >
                {stepIcon.icon}
                <span className="ml-2 text-sm font-medium">{stepIcon.label}</span>
                {index < stepIcons.length - 1 && (
                  <div className="h-[2px] w-8 bg-gray-300 mx-2" />
                )}
              </div>
            ))}
          </div>
        </CardTitle>
        <div className="border-b" />
        <CardDescription>
          <Progress value={(step / 5) * 100} className="my-1" />
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 space-y-4 text-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" encType="multipart/form-data">

          {/* Step 1 — Group Details */}
          {step === 1 && (
            <fieldset className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label>Group Name</Label>
                <Input
                  placeholder="Enter group name"
                  {...register("group_name", { required: "Group name is required" })}
                />
                {errors.group_name && <p className="text-red-500 text-xs mt-1">{errors.group_name.message}</p>}
              </div>
            </fieldset>
          )}

          {/* Step 2 — Contact */}
          {step === 2 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
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
                <Label>Contact</Label>
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
                <Label>Address</Label>
                <Textarea
                  placeholder="Enter group address"
                  {...register("client_address", { required: "Address is required" })}
                />
                {errors.client_address && <p className="text-red-500 text-xs mt-1">{errors.client_address.message}</p>}
              </div>
            </fieldset>
          )}

          {/* Step 3 — Settings */}
          {step === 3 && (
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

              <div className="flex items-center space-x-3">
                <Switch
                  checked={watch("client_mobile_banking_status") === "yes"}
                  onCheckedChange={(v) => setValue("client_mobile_banking_status", v ? "yes" : "no")}
                />
                <Label>Enable Mobile Banking</Label>
              </div>

              <div>
                <Label>Date of Joining</Label>
                <Controller
                  name="group_date_of_join"
                  control={control}
                  rules={{ required: "Date of joining is required" }}
                  render={({ field }) => {
                    const parsed = field.value ? new Date(field.value) : new Date();
                    return (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full text-left font-normal">
                            {parsed.toLocaleDateString()}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={parsed}
                            onSelect={field.onChange}
                            disabled={(d) => d < new Date("2000-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  }}
                />
                {errors.group_date_of_join && <p className="text-red-500 text-xs mt-1">{errors.group_date_of_join.message}</p>}
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  checked={watch("client_can_login_portal_app") === "yes"}
                  onCheckedChange={(v) => setValue("client_can_login_portal_app", v ? "yes" : "no")}
                />
                <Label>Allow Login to Portal / App</Label>
              </div>
            </fieldset>
          )}

          {/* Step 4 — Executives (search-based) */}
          {step === 4 && (
            <fieldset className="space-y-5">
              <div className="rounded-lg bg-muted/40 border p-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Group Executives / Officers</strong> — Search for existing individual
                clients and assign them an officer role (Chairperson, Secretary, Treasurer, etc.).
                Regular group members can be added after registration.
              </div>

              {/* Search */}
              <div className="space-y-2">
                <Label>Search Individual Client</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Name, account number, or contact…"
                    value={execSearch}
                    onChange={(e) => setExecSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleExecSearch())}
                  />
                  <Button type="button" size="sm" onClick={handleExecSearch} disabled={execSearching}>
                    {execSearching ? <span className="animate-spin">⟳</span> : <Search className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Results */}
                {execSearching && (
                  <div className="space-y-1">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded" />)}
                  </div>
                )}
                {!execSearching && execResults.length > 0 && (
                  <div className="border rounded-md divide-y max-h-56 overflow-y-auto shadow-sm">
                    {execResults.map((c) => (
                      <div key={c.client_id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/40 transition-colors">
                        <div>
                          <p className="font-medium text-sm capitalize">{c.client_firstname} {c.client_lastname}</p>
                          <p className="text-xs text-muted-foreground">{c.client_account_number} · {c.client_contact}</p>
                        </div>
                        <Button type="button" size="sm" variant="outline" onClick={() => addExecutive(c)}>
                          <UserCheck className="w-3.5 h-3.5 mr-1" /> Select
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {!execSearching && execSearch && execResults.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">No clients found. Try a different search.</p>
                )}
              </div>

              {/* Selected executives */}
              {executives.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Executives ({executives.length})</Label>
                  <div className="space-y-2">
                    {executives.map(({ client, role }) => (
                      <div key={client.client_id} className="flex items-center gap-3 border rounded-lg p-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {(client.client_firstname?.[0] ?? "") + (client.client_lastname?.[0] ?? "")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm capitalize truncate">
                            {client.client_firstname} {client.client_lastname}
                          </p>
                          <p className="text-xs text-muted-foreground">{client.client_account_number}</p>
                        </div>
                        <Select value={role} onValueChange={(v) => setExecRole(client.client_id, v)}>
                          <SelectTrigger className="w-44 shrink-0">
                            <SelectValue placeholder="Assign role…" />
                          </SelectTrigger>
                          <SelectContent>
                            {EXECUTIVE_ROLES.map((r) => (
                              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-red-500 shrink-0"
                          onClick={() => removeExecutive(client.client_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {executives.length === 0 && (
                <div className="text-center py-8 border rounded-lg border-dashed text-muted-foreground text-sm">
                  No executives selected yet. This step is optional — you can skip it.
                </div>
              )}
            </fieldset>
          )}

          {/* Step 5 — Group Photo */}
          {step === 5 && (
            <fieldset className="grid grid-cols-1 gap-4">
              <div className="flex flex-col items-center space-y-2">
                <Label>Group Logo / Photo</Label>
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
                    <span className="text-gray-400 text-sm">No Image</span>
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  {...register("user_image")}
                  className="hidden"
                  id="file-upload"
                  onChange={handleImageChange}
                />
                <Button asChild variant="outline" className="w-full">
                  <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-2">
                    <UploadIcon className="w-5 h-5 text-gray-600" /> Upload Image
                  </label>
                </Button>
              </div>
            </fieldset>
          )}

          <CardFooter className="px-0 pt-4">
            <div className="flex justify-end w-full gap-2">
              {step > 1 && (
                <Button type="button" variant="secondary" onClick={prevStep}>
                  <ArrowLeft className="mr-2" /> Back
                </Button>
              )}
              {step < 5 && (
                <Button type="button" onClick={validateStep}>
                  Next <ArrowRight className="ml-2" />
                </Button>
              )}
              {step === 5 && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving…" : <><CheckCircle className="mr-2" /> Submit</>}
                </Button>
              )}
            </div>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
};

export default GroupRegistrationForm;
