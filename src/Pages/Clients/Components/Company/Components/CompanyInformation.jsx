/* eslint-disable react/prop-types */
import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTimestamp } from "@/lib/utils";
import { getInitials } from "@/lib/general-functions";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Hash,
  Users,
  Banknote,
  CalendarDays,
  FileText,
  UserCheck,
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

const CompanyInformation = ({ data, isLoading, refetch, isRefetching, isError }) => {
  const { id } = useParams();
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const logoRef = useRef(null);
  const [logoPreview, setLogoPreview] = useState(data?.client_passport_photo || "");

  useEffect(() => {
    if (data?.client_passport_photo) setLogoPreview(data.client_passport_photo);
  }, [data]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append("file_type", "passport");
    fd.append("file", file);
    fd.append("client_id", id);
    try {
      const res = await axiosPrivate.post("/clients/images", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast({ title: "Logo updated", description: res.data.messages });
      refetch();
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
      setLogoPreview(data?.client_passport_photo || "");
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

  const detail = data?.companyDetail;

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
                onClick={() => logoRef.current?.click()}
              >
                <AvatarImage src={logoPreview} />
                <AvatarFallback className="text-xl font-bold">
                  {getInitials(data?.client_firstname ?? "CO")}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground">Click to update logo</p>
              <input
                type="file"
                ref={logoRef}
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
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
              <h2 className="text-lg font-bold capitalize">{data?.client_firstname}</h2>
              <p className="text-sm text-muted-foreground">{data?.client_account_number}</p>
              <Badge variant={data?.client_status === "active" ? "success" : "destructive"}>
                {data?.client_status}
              </Badge>
              {detail?.company_type && (
                <p className="text-xs text-muted-foreground capitalize mt-1">
                  {detail.company_type.replace(/_/g, " ")}
                </p>
              )}
            </>
          )}
        </div>

        <Button
          size="sm"
          onClick={() => navigate(`/clients/company/${id}/edit-client`)}
        >
          Update
        </Button>
      </div>

      {/* Company details */}
      <div className="border rounded-lg shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4" /> Company Details
        </h3>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <Field label="Registration Number" value={detail?.company_registration_number} icon={Hash} />
            <Field label="TIN / Tax ID" value={detail?.company_tax_id} icon={FileText} />
            <Field label="Industry" value={detail?.company_industry} icon={Building2} />
            <Field
              label="Company Type"
              value={detail?.company_type?.replace(/_/g, " ")}
              icon={Building2}
            />
            <Field
              label="Date Incorporated"
              value={formatDateTimestamp(detail?.company_date_incorporated)}
              icon={CalendarDays}
            />
            <Field label="Number of Employees" value={detail?.company_num_employees} icon={Users} />
            <Field
              label="Annual Revenue"
              value={
                detail?.company_annual_revenue
                  ? `UGX ${Number(detail.company_annual_revenue).toLocaleString()}`
                  : null
              }
              icon={Banknote}
            />
            <Field label="Website" value={detail?.company_website} icon={Globe} />
          </div>
        )}
      </div>

      {/* Contact & Address */}
      <div className="border rounded-lg shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Phone className="w-4 h-4" /> Contact Information
        </h3>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <Field label="Phone" value={data?.client_contact} icon={Phone} />
            <Field label="Email" value={data?.client_email_address} icon={Mail} />
            <Field label="Physical Address" value={detail?.company_physical_address || data?.client_address} icon={MapPin} />
            <Field label="Postal Address" value={detail?.company_postal_address} icon={MapPin} />
          </div>
        )}
      </div>

      {/* Directors */}
      <div className="border rounded-lg shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <UserCheck className="w-4 h-4" /> Directors &amp; Signatories
        </h3>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : !data?.companyDirectors?.length ? (
          <p className="text-sm text-muted-foreground">No directors recorded.</p>
        ) : (
          <div className="space-y-3">
            {data.companyDirectors.map((d, i) => (
              <div key={i} className="border rounded-md p-4 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                <Field
                  label="Name"
                  value={`${d.director_firstname} ${d.director_lastname}`}
                  icon={Users}
                />
                <Field label="Role" value={d.director_role?.replace(/_/g, " ")} icon={UserCheck} />
                <Field label="Contact" value={d.director_contact} icon={Phone} />
                <Field label="Email" value={d.director_email} icon={Mail} />
                <Field label="Identification" value={d.director_identification} icon={Hash} />
                <Field label="Nationality" value={d.director_nationality} icon={Globe} />
                {d.ownership_percentage != null && (
                  <Field label="Ownership %" value={`${d.ownership_percentage}%`} icon={Banknote} />
                )}
                {d.is_authorized_signatory === 1 && (
                  <div className="col-span-full">
                    <Badge variant="outline">Authorized Signatory</Badge>
                  </div>
                )}
              </div>
            ))}
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

export default CompanyInformation;
