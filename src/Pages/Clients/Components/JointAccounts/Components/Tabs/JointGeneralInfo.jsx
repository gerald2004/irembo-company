/* eslint-disable react/prop-types */
import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import { getInitials } from "@/lib/general-functions";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useAuth from "@/MiddleWares/Hooks/useAuth";

const JointGeneralInfo = ({ data, isLoading, refetch, isRefetching, isError }) => {
  const { id } = useParams();
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const photoRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(data?.client_passport_photo || "");
  const { auth } = useAuth();
  const roles = auth?.roles;

  useEffect(() => {
    if (data?.client_passport_photo) setPhotoPreview(data.client_passport_photo);
  }, [data]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append("file_type", "passport");
    fd.append("file", file);
    fd.append("client_id", id);
    try {
      const res = await axiosPrivate.post("/clients/images", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast({ title: "Photo updated", description: res.data.messages });
      refetch();
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
      setPhotoPreview(data?.client_passport_photo || "");
    }
  };

  if (isError) {
    return (
      <div className="text-center p-8">
        <p className="font-semibold mb-4">Failed to load data. Please try again.</p>
        <Button onClick={refetch} disabled={isRefetching}>
          {isRefetching ? "Retrying..." : "Retry"}
        </Button>
      </div>
    );
  }

  const primaryName = [data?.client_firstname, data?.client_middlename, data?.client_lastname]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="max-w-5xl mx-auto p-5 space-y-8">
      {/* Header card */}
      <div className="flex justify-between items-center mb-6 border p-6 rounded-lg shadow-sm">
        <div className="flex gap-10 items-start">
          <div className="flex flex-col items-center space-y-2">
            {isLoading ? (
              <Skeleton className="w-20 h-20 rounded-full" />
            ) : (
              <>
                <Avatar
                  className="w-20 h-20 cursor-pointer"
                  onClick={hasPermission(roles, 100152) ? () => photoRef.current?.click() : undefined}
                >
                  <AvatarImage src={photoPreview} alt="Profile" />
                  <AvatarFallback className="text-xl font-bold">
                    {getInitials(primaryName || "JA")}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs text-center text-muted-foreground">Click to update photo</p>
                <input
                  type="file"
                  ref={photoRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </>
            )}
          </div>

          <div className="space-y-2 text-sm">
            {isLoading ? (
              <>
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-28" />
              </>
            ) : (
              <>
                <h6 className="font-bold capitalize text-base">{primaryName}</h6>
                <p className="text-muted-foreground text-xs">{data?.client_account_number}</p>
                <Badge variant={data?.client_status === "active" ? "success" : "destructive"}>
                  {data?.client_status}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Joint Account · {data?.jointHolders?.length ?? 0} additional holder(s)
                </p>
              </>
            )}
          </div>
        </div>

        {hasPermission(roles, 100009) && (
          <Button size="sm" onClick={() => navigate(`/clients/joint-account/${id}/edit-client`)}>
            Update
          </Button>
        )}
      </div>

      {/* Primary Holder Details */}
      <div className="border p-6 rounded-lg shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Primary Holder</h3>
        <div className="grid grid-cols-2 text-sm gap-x-6 gap-y-4">
          {isLoading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex gap-x-4 items-center">
                <Skeleton className="w-1/3 h-4" />
                <Skeleton className="w-2/3 h-4" />
              </div>
            ))
          ) : (
            <>
              <div className="flex gap-x-4 items-center">
                <Label className="w-1/2 font-semibold">Full Name</Label>
                <span className="w-1/2 capitalize">{primaryName || "—"}</span>
              </div>
              <div className="flex gap-x-4 items-center">
                <Label className="w-1/2 font-semibold">Identification</Label>
                <span className="w-1/2">{data?.client_identification || "—"}</span>
              </div>
              <div className="flex gap-x-4 items-center">
                <Label className="w-1/2 font-semibold">Date of Birth</Label>
                <span className="w-1/2">{formatDateTimestamp(data?.client_date_of_birth) || "—"}</span>
              </div>
              <div className="flex gap-x-4 items-center">
                <Label className="w-1/2 font-semibold">Gender</Label>
                <span className="w-1/2 capitalize">{data?.client_gender || "—"}</span>
              </div>
              <div className="flex gap-x-4 items-center">
                <Label className="w-1/2 font-semibold">Phone</Label>
                <span className="w-1/2">{data?.client_contact || "—"}</span>
              </div>
              <div className="flex gap-x-4 items-center">
                <Label className="w-1/2 font-semibold">Email</Label>
                <span className="w-1/2">{data?.client_email_address || "—"}</span>
              </div>
              <div className="flex gap-x-4 items-center">
                <Label className="w-1/2 font-semibold">Address</Label>
                <span className="w-1/2">{data?.client_address || "—"}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Account Meta */}
      <div className="border p-6 rounded-lg shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Account Information</h3>
        <div className="grid grid-cols-2 text-sm gap-x-6 gap-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-x-4 items-center">
                <Skeleton className="w-1/3 h-4" />
                <Skeleton className="w-2/3 h-4" />
              </div>
            ))
          ) : (
            <>
              <div className="flex gap-x-4 items-center">
                <Label className="w-1/2 font-semibold">Account No.</Label>
                <span className="w-1/2">{data?.client_account_number}</span>
              </div>
              <div className="flex gap-x-4 items-center">
                <Label className="w-1/2 font-semibold">Date of Joining</Label>
                <span className="w-1/2">{formatDateTimestamp(data?.client_date_of_join)}</span>
              </div>
              <div className="flex gap-x-4 items-center">
                <Label className="w-1/2 font-semibold">Branch</Label>
                <span className="w-1/2">{data?.branch?.branch_name || "—"}</span>
              </div>
              <div className="flex gap-x-4 items-center">
                <Label className="w-1/2 font-semibold">Registered By</Label>
                <span className="w-1/2">{`${data?.user?.user_firstname ?? ""} ${data?.user?.user_lastname ?? ""}`.trim() || "—"}</span>
              </div>
              <div className="flex gap-x-4 items-center col-span-2">
                <Label className="w-1/4 font-semibold">Extra Notes</Label>
                <span className="w-3/4">{data?.client_extra_notes || "—"}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JointGeneralInfo;
