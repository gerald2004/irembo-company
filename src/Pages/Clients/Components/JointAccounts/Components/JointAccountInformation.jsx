/* eslint-disable react/prop-types */
import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTimestamp } from "@/lib/utils";
import { getInitials } from "@/lib/general-functions";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import {
  Users2,
  Phone,
  Mail,
  MapPin,
  Hash,
  CalendarDays,
  UserCheck,
  Building2,
  FileText,
  Banknote,
  Heart,
} from "lucide-react";

const Field = ({ label, value, icon: Icon }) => (
  <div className="flex gap-x-3 items-start">
    {Icon && <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{value || "—"}</p>
    </div>
  </div>
);

const JointAccountInformation = ({ data, isLoading, refetch, isRefetching, isError }) => {
  const { id } = useParams();
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const photoRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(data?.client_passport_photo || "");

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
    <div className="max-w-5xl mx-auto p-5 space-y-6">
      {/* Header card */}
      <div className="flex items-start gap-6 border p-6 rounded-lg shadow-sm">
        <div className="flex flex-col items-center gap-2 shrink-0">
          {isLoading ? (
            <Skeleton className="w-20 h-20 rounded-full" />
          ) : (
            <>
              <Avatar
                className="w-20 h-20 cursor-pointer"
                onClick={() => photoRef.current?.click()}
              >
                <AvatarImage src={photoPreview} />
                <AvatarFallback className="text-xl font-bold">
                  {getInitials(primaryName || "JA")}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground">Click to update photo</p>
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

        <div className="flex-1 space-y-1">
          {isLoading ? (
            <>
              <Skeleton className="h-6 w-56 mb-2" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold capitalize">{primaryName}</h2>
              <p className="text-sm text-muted-foreground">{data?.client_account_number}</p>
              <Badge variant={data?.client_status === "active" ? "success" : "destructive"}>
                {data?.client_status}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Joint Account · {data?.jointHolders?.length ?? 0} additional holder(s)
              </p>
            </>
          )}
        </div>

        <Button
          size="sm"
          onClick={() => navigate(`/clients/joint-account/${id}/edit-client`)}
        >
          Update
        </Button>
      </div>

      {/* Primary holder */}
      <div className="border rounded-lg shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <UserCheck className="w-4 h-4" /> Primary Holder
        </h3>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <Field label="Full Name" value={primaryName} icon={UserCheck} />
            <Field label="Identification" value={data?.client_identification} icon={Hash} />
            <Field label="Date of Birth" value={formatDateTimestamp(data?.client_date_of_birth)} icon={CalendarDays} />
            <Field label="Gender" value={data?.client_gender} icon={UserCheck} />
            <Field label="Phone" value={data?.client_contact} icon={Phone} />
            <Field label="Email" value={data?.client_email_address} icon={Mail} />
            <Field label="Address" value={data?.client_address} icon={MapPin} />
          </div>
        )}
      </div>

      {/* Additional holders */}
      <div className="border rounded-lg shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Users2 className="w-4 h-4" /> Additional Holders
        </h3>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : !data?.jointHolders?.length ? (
          <p className="text-sm text-muted-foreground">No additional holders recorded.</p>
        ) : (
          <div className="space-y-3">
            {data.jointHolders.map((h, i) => {
              const holderName = [h.holder_firstname, h.holder_middlename, h.holder_lastname]
                .filter(Boolean)
                .join(" ");
              return (
                <div key={i} className="border rounded-md p-4 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                  <Field label="Full Name" value={holderName} icon={UserCheck} />
                  <Field label="Identification" value={h.holder_identification} icon={Hash} />
                  <Field label="Date of Birth" value={formatDateTimestamp(h.holder_date_of_birth)} icon={CalendarDays} />
                  <Field label="Gender" value={h.holder_gender} icon={UserCheck} />
                  <Field label="Contact" value={h.holder_contact} icon={Phone} />
                  <Field label="Email" value={h.holder_email} icon={Mail} />
                  <Field label="Relationship" value={h.holder_relationship} icon={Heart} />
                  {h.ownership_percentage != null && (
                    <Field label="Ownership %" value={`${h.ownership_percentage}%`} icon={Banknote} />
                  )}
                  <Field label="Address" value={h.holder_address} icon={MapPin} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Account meta */}
      <div className="border rounded-lg shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold">Account Information</h3>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <Field label="Account Number" value={data?.client_account_number} icon={Hash} />
            <Field label="Date of Joining" value={formatDateTimestamp(data?.client_date_of_join)} icon={CalendarDays} />
            <Field label="Branch" value={data?.branch?.branch_name} icon={Building2} />
            <Field label="Registered By" value={`${data?.user?.user_firstname ?? ""} ${data?.user?.user_lastname ?? ""}`} icon={UserCheck} />
            <Field label="Extra Notes" value={data?.client_extra_notes} icon={FileText} />
          </div>
        )}
      </div>
    </div>
  );
};

export default JointAccountInformation;
