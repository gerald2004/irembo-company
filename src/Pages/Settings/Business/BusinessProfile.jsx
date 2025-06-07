import { useForm } from "react-hook-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getInitials } from "@/lib/general-functions";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
const BusinessProfile = () => {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const {
    data: businessProfile,
    isLoading: isLoadingBusinessProfile,
    isRefetching: isRefetchingBusinessProfile,
    isError: isErrorBusinessProfile,
    refetch: refetchBusinessProfile,
  } = useQuery({
    queryKey: ["business-profile"],
    queryFn: async () => {
            const controller = new AbortController();

      const fetchURL = `/business/profile`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        if (!response.data.data) {
          throw new Error(response?.data?.message);
        }
        return response.data.data.business_profile;
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw new Error(error?.response?.data?.message);
      }
    },
  });
  const {
    data: businessImage,
    isLoading: isLoadingBusinessImage,
    isRefetching: isRefetchingBusinessImage,
    isError: isErrorBusinessImage,
    refetch: refetchBusinessImage,
  } = useQuery({
    queryKey: ["business-photo"],
    queryFn: async () => {
            const controller = new AbortController();

      const fetchURL = `/business/photo`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        if (!response.data.data) {
          throw new Error(response?.data?.message);
        }
        return response.data.data.file;
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw new Error(error?.response?.data?.message);
      }
    },
  });
  const {
    register: registerBusinessProfile,
    handleSubmit: handleSubmitBusinessProfile,
    reset: resetBusinessProfile,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      code: "",
      name: "",
      email: "",
      contact: "",
      location: "",
      short_name: "",
      registration_date: "",
      extra_contacts: "",
      extra_emails: "",
    },
  });

  useEffect(() => {
    if (businessProfile) {
      resetBusinessProfile({
        code: businessProfile.code || "",
        registration_date: businessProfile.registration_date || "",
        name: businessProfile.name || "",
        email: businessProfile.email || "",
        contact: businessProfile.contact || "",
        location: businessProfile.location || "",
        short_name: businessProfile.short_name || "",
        extra_contacts: businessProfile.extra_contacts || "",
        extra_emails: businessProfile.extra_emails || "",
      });
    }
  }, [businessProfile, resetBusinessProfile]);

  const onSubmitBusinessProfile = async (data) => {
          const controller = new AbortController();

    try {
      const response = await axiosPrivate.patch(`/business/profile`, data, {
        signal: controller.signal,
      });
      toast({ title: "Success", description: response?.data?.messages });
      resetBusinessProfile();
      refetchBusinessProfile();
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
  const {
    register: registerBusinessImage,
    handleSubmit: handleSubmitBusinessImage,
    formState: { isSubmitting: isUploading },
  } = useForm();
  const onSubmitBusinessImage = async (data) => {
          const controller = new AbortController();

    try {
      const formData = new FormData();
      formData.append("file", data.logo[0]);
      const response = await axiosPrivate.post(`/business/photo`, formData, {
        headers: { "Content-Type": `multipart/form-data;` },
        signal: controller.signal,
      });
      refetchBusinessImage();
      toast({ title: "Success", description: response?.data?.messages });
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
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Business Profile</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Business Profile
            </h5>
          </div>
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            {isLoadingBusinessImage || isRefetchingBusinessImage ? (
              <>
                <Skeleton className="h-[150px] rounded-xl" />
              </>
            ) : isErrorBusinessImage ? (
              <Button onClick={refetchBusinessImage}>Retry</Button>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Business Logo</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage
                      src={businessImage || ""}
                      alt="Business Logo"
                    />
                    <AvatarFallback className="text-1xl font-semibold">
                      {getInitials(`Business Logo`)}
                    </AvatarFallback>
                  </Avatar>
                  <form
                    onSubmit={handleSubmitBusinessImage(onSubmitBusinessImage)}
                    className="text-center space-y-4"
                  >
                    <div>
                      <Label htmlFor="upload-logo" className="text-sm">
                        Upload New Logo
                      </Label>
                      <Input
                        id="upload-logo"
                        type="file"
                        accept="image/*"
                        className="mt-2"
                        {...registerBusinessImage("logo", {
                          required: "Please upload a logo",
                        })}
                      />
                    </div>
                    <Button
                      className="mt-2"
                      type="submit"
                      disabled={isUploading}
                    >
                      {isSubmitting ? "Uploading Image..." : "Upload"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
            {isLoadingBusinessProfile || isRefetchingBusinessProfile ? (
              <>
                <Skeleton className="h-[500px] rounded-xl" />
              </>
            ) : isErrorBusinessProfile ? (
              <Button onClick={refetchBusinessProfile}>Retry</Button>
            ) : (
              <form
                onSubmit={handleSubmitBusinessProfile(onSubmitBusinessProfile)}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Business Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="business-code">Business Code</Label>
                          <Input
                            id="business-code"
                            placeholder="Enter business code"
                            className="mt-1"
                            {...registerBusinessProfile("code", {
                              required: "Code is required",
                            })}
                            disabled
                          />
                          {errors.name && (
                            <p className="text-red-500 text-sm">
                              {errors.name.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="business-registration">
                            Business Registration Date
                          </Label>
                          <Input
                            id="business-registration"
                            placeholder="Enter Registration Date"
                            className="mt-1"
                            {...registerBusinessProfile("registration_date", {
                              required: "Registration Date is required",
                            })}
                            disabled
                          />
                          {errors.name && (
                            <p className="text-red-500 text-sm">
                              {errors.name.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="business-name">Business Name</Label>
                          <Input
                            id="business-name"
                            placeholder="Enter business name"
                            className="mt-1"
                            {...registerBusinessProfile("name", {
                              required: "Name is required",
                            })}
                          />
                          {errors.name && (
                            <p className="text-red-500 text-sm">
                              {errors.name.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="business-short-name">
                            Business Short Name
                          </Label>
                          <Input
                            id="business-short-name"
                            placeholder="Enter business short name"
                            className="mt-1"
                            {...registerBusinessProfile("short_name", {
                              required: "Short Name is required",
                            })}
                          />
                          {errors.short_name && (
                            <p className="text-red-500 text-sm">
                              {errors.short_name.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter email address"
                            className="mt-1"
                            {...registerBusinessProfile("email", {
                              required: "Email is required",
                              pattern: {
                                value:
                                  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                                message: "Enter a valid email",
                              },
                            })}
                          />
                          {errors.email && (
                            <p className="text-red-500 text-sm">
                              {errors.email.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="Enter phone number"
                            className="mt-1"
                            {...registerBusinessProfile("contact", {
                              required: "Phone number is required",
                              pattern: {
                                value: /^[0-9]{10,12}$/,
                                message: "Enter a valid phone number",
                              },
                            })}
                          />
                          {errors.contact && (
                            <p className="text-red-500 text-sm">
                              {errors.contact.message}
                            </p>
                          )}
                        </div>

                        <div className="col-span-full">
                          <Label htmlFor="address">Business Address</Label>
                          <Textarea
                            id="address"
                            placeholder="Enter business address"
                            className="mt-1"
                            {...registerBusinessProfile("location", {
                              required: "Address is required",
                            })}
                          />
                          {errors.location && (
                            <p className="text-red-500 text-sm">
                              {errors.location.message}
                            </p>
                          )}
                        </div>
                        <div className="col-span-full">
                          <Label htmlFor="extra_contacts">
                            Business Extra Contacts
                          </Label>
                          <Textarea
                            id="extra_contacts"
                            placeholder="Enter business address"
                            className="mt-1"
                            {...registerBusinessProfile("extra_contacts")}
                          />
                        </div>
                        <div className="col-span-full">
                          <Label htmlFor="extra_emails">
                            Business Extra Emails
                          </Label>
                          <Textarea
                            id="extra_emails"
                            placeholder="Enter business Extra Emails"
                            className="mt-1"
                            {...registerBusinessProfile("extra_emails")}
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      className="mt-6"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving Please Wait..." : "Save Changes"}
                    </Button>
                  </CardContent>
                </Card>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BusinessProfile;
