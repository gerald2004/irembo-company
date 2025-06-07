/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
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
  Cog,BookUser,
  CheckCircle,
  CalendarIcon,
  Phone,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
import { useNavigate, useParams } from "react-router-dom";
import { Switch } from "@/components/ui/switch";

const GroupEditForm = ({defaultValues}) => {  
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const {id} = useParams();
  const {
    register,
    handleSubmit,
    setValue,
    control,
    trigger,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({defaultValues: defaultValues});

  const [step, setStep] = useState(1);

  // Progress the form
  const validateStep = async () => {
    const valid = await trigger();
    if (valid && step < 3) {
      setStep((prev) => prev + 1);
    }
  };

  // Go back a step
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));


  const onSubmit = async (data) => {
      const controller = new AbortController();
    try {
      // ✅ Send PATCH request to update other fields (excluding image)
      const response = await axiosPrivate.patch(`/clients/groups/${id}`, data, {
        signal: controller.signal,
      });
      // ✅ Show success toast
      toast({ title: "Success", description: response?.data?.messages });
      // ✅ Reset form and refresh data
      console.log(response)
      reset();
      setStep(1);
      navigate(`/clients/group/${id}`);
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
  // Function to handle checking the national database
  const stepIcons = [
    {
      icon: <BookUser className="w-6 h-6 text-blue-500" />,
      label: "Details",
    },
    {
      icon: <Phone className="w-6 h-6 text-red-500" />,
      label: "Contact Information",
    },
    {
      icon: <Cog className="w-6 h-6 text-yellow-500" />,
      label: "Client Settings",
    },  
  ];

  useEffect(() => {
    if (defaultValues) {
      // ✅ Set Basic Form Fields
      Object.keys(defaultValues).forEach((key) => {
        let value = defaultValues[key];

        // ✅ Handle Date Fields (Convert to YYYY-MM-DD)
        if (key.includes("date") && typeof value === "string") {
          value = new Date(value).toISOString().split("T")[0];
        }
        // ✅ Set All Other Fields
        if (value !== undefined) {
          setValue(key, value);
        }
      });
    }
  }, [defaultValues, setValue]);
  return (
    <>
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="p-4 rounded-t-xl">
          <CardTitle className="text-sm font-semibold">
            <div className="flex items-center space-x-4 my-1">
              {stepIcons.map((stepIcon, index) => (
                <div
                  key={index}
                  className={`flex items-center ${
                    step > index + 1 ? "opacity-100" : "opacity-50"
                  } transition-opacity`}
                >
                  {stepIcon.icon}
                  <span className="ml-2 text-sm font-medium">
                    {stepIcon.label}
                  </span>
                  {index < stepIcons.length - 1 && (
                    <div className="h-[2px] w-8 bg-gray-300 mx-2"></div>
                  )}
                </div>
              ))}
            </div>
          </CardTitle>
          <div className="border-b" />
          <CardDescription className="text-sm capitalize">
            <Progress value={(step / 3) * 100} className="my-1" />
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4 text-sm">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            encType="multipart/form-data"
          >
            {step === 1 && (
              <fieldset className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="client_group_name">Group Name</Label>
                  <Input
                    id="client_group_name"
                    placeholder="Enter group name"
                    {...register("client_group_name", {
                      required: "Group name is required",
                    })}
                  />
                  {errors.client_group_name && (
                    <p className="text-red-500 text-sm">
                      {errors.client_group_name.message}
                    </p>
                  )}
                </div>
              </fieldset>
            )}

            {step === 2 && (
              <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    {...register("client_email_address", {
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Invalid email address",
                      },
                    })}
                  />
                  {errors.client_email_address && (
                    <p className="text-red-500 text-sm">
                      {errors.client_email_address.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="contact">Contact</Label>
                  <Input
                    id="contact"
                    type="tel"
                    placeholder="Enter contact number"
                    {...register("client_contact", {
                      required: "Contact is required",
                    })}
                    maxLength={12}
                  />
                  {errors.client_contact && (
                    <p className="text-red-500 text-sm">
                      {errors.client_contact.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="client_address">Address</Label>
                  <Textarea
                    id="client_address"
                    type="client_address"
                    placeholder="Enter Residential address"
                    {...register("client_address", {
                      required: "Address Field Is Required",
                    })}
                  />
                  {errors.client_address && (
                    <p className="text-red-500 text-sm">
                      {errors.client_address.message}
                    </p>
                  )}
                </div>
              </fieldset>
            )}

            {step === 3 && (
              <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Status */}
                <div>
                  <Label>Status</Label>
                  <Select
                    onValueChange={(value) => setValue("client_status", value)}
                  >
                    <SelectTrigger
                      {...register("client_status", {
                        required: "Status is required",
                      })}
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.client_status && (
                    <p className="text-red-500 text-sm">
                      {errors.client_status.message}
                    </p>
                  )}
                </div>

                {/* Mobile Banking Status (Switch) */}
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={watch("client_mobile_banking_status") === "yes"}
                    onCheckedChange={(checked) =>
                      setValue(
                        "client_mobile_banking_status",
                        checked ? "yes" : "no"
                      )
                    }
                  />
                  <Label>Enable Mobile Banking</Label>
                </div>
                <div>
                  <Label htmlFor="group_date_of_join">Date Of Joining</Label>
                  <Controller
                    name="group_date_of_join"
                    control={control}
                    rules={{ required: "Date of joining is required" }}
                    render={({ field }) => {
                      const parsedDate = field.value
                        ? new Date(field.value)
                        : null;
                      return (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className="w-full pl-3 text-left font-normal"
                            >
                              {parsedDate
                                ? parsedDate.toLocaleDateString()
                                : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={parsedDate}
                              onSelect={(date) =>
                                field.onChange(
                                  date?.toISOString().split("T")[0]
                                )
                              }
                              disabled={(date) => date < new Date("2000-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      );
                    }}
                  />

                  {errors.group_date_of_join && (
                    <p className="text-red-500 text-sm">
                      {errors.group_date_of_join.message}
                    </p>
                  )}
                </div>

                {/* Login Portal/App Access (Switch) */}
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={watch("client_can_login_portal_app") === "yes"}
                    onCheckedChange={(checked) =>
                      setValue(
                        "client_can_login_portal_app",
                        checked ? "yes" : "no"
                      )
                    }
                  />
                  <Label>Allow Login to Portal/App</Label>
                </div>
              </fieldset>
            )}
            <CardFooter>
              <div className="flex justify-end w-full">
                {step > 1 && (
                  <Button
                    type="button"
                    className="mx-2"
                    variant="secondary"
                    onClick={prevStep}
                  >
                    <ArrowLeft className="mr-2" /> Back
                  </Button>
                )}
                {step < 3 ? (
                  <Button type="button" onClick={validateStep}>
                    Next <ArrowRight className="ml-2" />
                  </Button>
                ) : (
                  ""
                )}
                {step === 3 && (
                  <Button type="submit">
                    {isSubmitting ? (
                      "Saving Please wait ..."
                    ) : (
                      <>
                        Update <CheckCircle className="ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default GroupEditForm;
