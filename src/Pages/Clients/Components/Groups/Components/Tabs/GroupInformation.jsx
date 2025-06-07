/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/general-functions";
import { formatDateTimestamp } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
const GroupInformation = ({
  data,
  isLoading,
  refetch,
  isRefetching,
  isError,
}) => {
  const { id } = useParams();
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  // File input refs
  const profileInputRef = useRef(null);
  // const signatureInputRef = useRef(null);

  // State for Preview Images
  const [profilePreview, setProfilePreview] = useState(
    data?.client_passport_photo || ""
  );
  // const [signaturePreview, setSignaturePreview] = useState(
  //   data?.client_signature || ""
  // );

  useEffect(() => {
    if (data?.client_passport_photo) {
      setProfilePreview(data.client_passport_photo);
    }
    // if (data?.client_signature) {
    //   setSignaturePreview(data.client_signature);
    // }
  }, [data]); // Runs when `data` updates

  // Open File Picker
  const openFilePicker = (ref) => {
    if (ref.current) {
      ref.current.click();
    }
  };

  const handleFileUpload = async (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Update Preview
    if (fileType === "passport") setProfilePreview(URL.createObjectURL(file));
    // if (fileType === "signature")
      // setSignaturePreview(URL.createObjectURL(file));

    // Upload File
    const formData = new FormData();
    formData.append("file_type", fileType);
    formData.append("file", file);
    formData.append("client_id", id);
          const controller = new AbortController();

    try {
      const response = await axiosPrivate.post("/clients/images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        signal: controller.signal,
      });

      toast({
        title: "Upload Successful",
        description: response.data.messages,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Upload Failed",
        variant: "destructive",
        description: error.response?.data?.message || "Something went wrong.",
      });

      // Reset Preview on Failure
      if (fileType === "passport")
        setProfilePreview(data?.client_passport_photo || "");
      // if (fileType === "signature")
      //   setSignaturePreview(data?.client_signature || "");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-5 space-y-8">
      {isError ? (
        <div className="text-center">
          <p className="font-semibold mb-4">
            Failed to load data. Please try again.
          </p>
          <Button onClick={refetch} disabled={isRefetching}>
            {isRefetching ? "Retrying Please Wait..." : "Retry"}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6 border p-6 rounded-lg shadow-sm">
            <div className="flex gap-20 items-start">
              <div className="flex flex-col items-center space-y-2">
                {isLoading ? (
                  <Skeleton className="w-20 h-20 rounded-full" />
                ) : (
                  <>
                    <Avatar
                      className="w-20 h-20 cursor-pointer"
                      onClick={() => openFilePicker(profileInputRef)}
                    >
                      <AvatarImage src={profilePreview} alt="Profile Picture" />
                      <AvatarFallback className="text-1xl font-semibold">
                        {getInitials(
                          `${data?.client_group_name}`
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-center">
                      Click to upload picture
                    </p>
                    <input
                      type="file"
                      ref={profileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "passport")}
                    />
                  </>
                )}
              </div>

              {/* Signature Section in Box Format */}
              {/* <div className="text-center space-y-2">
                {isLoading ? (
                  <Skeleton className="w-[120px] h-[80px]" />
                ) : (
                  <>
                    <div
                      className="w-30 h-20 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer"
                      onClick={() => openFilePicker(signatureInputRef)}
                    >
                      {data?.client_signature ? (
                        <img
                          src={signaturePreview}
                          alt="Signature"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-sm font-semibold">Signature</span>
                      )}
                    </div>
                    <p className="text-sm">Click to upload signature</p>
                    <input
                      type="file"
                      ref={signatureInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "signature")}
                    />
                  </>
                )}
              </div> */}

              {/* Bio Details */}
              <div className="space-y-2 text-sm items-end">
                {isLoading ? (
                  <>
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-4 w-60 mb-1" />
                    <Skeleton className="h-4 w-60 mb-1" />
                  </>
                ) : (
                  <>
                    <h6 className="font-bold capitalize">
                      {`${data?.client_group_name}`}
                    </h6>
                    <p>
                      <span className="font-medium">Date of Joining:</span>{" "}
                      <span>
                        {formatDateTimestamp(data?.client_date_of_join)}
                      </span>
                    </p>
                  </>
                )}
              </div>
              <div className="space-y-10 items-end">
                <Button
                  size="sm"
                  onClick={() =>
                    navigate(`/clients/group/${id}/edit-client`)
                  }
                >
                  Update
                </Button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 text-sm gap-x-6 gap-y-4 border p-6 rounded-lg shadow-sm">
            {isLoading ? (
              Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="flex gap-x-4 items-center">
                  <Skeleton className="w-1/3 h-4" />
                  <Skeleton className="w-2/3 h-4" />
                </div>
              ))
            ) : (
              <>
                <div className="flex gap-x-4 items-center">
                  <Label className="w-1/3 font-semibold">Account No.</Label>
                  <span className="w-2/3">{data?.client_account_number}</span>
                </div>
                <div className="flex gap-x-4 items-center">
                  <Label className="w-1/3 font-semibold">Contact</Label>
                  <span className="w-2/3">{data?.client_contact || "0"}</span>
                </div>
                <div className="flex gap-x-4 items-center">
                  <Label className="w-1/3 font-semibold">Email Address</Label>
                  <span className="w-2/3">
                    {data?.client_email_address || "No Email Address"}
                  </span>
                </div>
                <div className="flex gap-x-4 items-center">
                  <Label className="w-1/3 font-semibold">Date Of Joining</Label>
                  <span className="w-2/3">
                    {formatDateTimestamp(data?.client_date_of_join)}
                  </span>
                </div>
                <div className="flex gap-x-4 items-center">
                  <Label className="w-1/3 font-semibold">Branch</Label>
                  <span className="w-2/3">{data?.branch?.branch_name}</span>
                </div>
                <div className="flex gap-x-4 items-center">
                  <Label className="w-1/3 font-semibold">Registered By</Label>
                  <span className="w-2/3">{`${data?.user?.user_lastname} ${data?.user?.user_firstname}`}</span>
                </div>
                <div className="flex gap-x-4 items-center">
                  <Label className="w-1/3 font-semibold">
                    Extra Information
                  </Label>
                  <span className="w-2/3">
                    {data?.client_extra_notes || "None"}
                  </span>
                </div>
                <div className="flex gap-x-4 items-center">
                  <Label className="w-1/3 font-semibold">Address</Label>
                  <span className="w-2/3">
                    {data?.client_address || "None"}
                  </span>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GroupInformation;
