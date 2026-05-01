import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import CompanyEditForm from "./Components/Forms/CompanyEditForm";

const EditCompany = () => {
  const axiosPrivate = useAxiosPrivate();
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["company-client", id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/clients/company/${id}`);
        if (!res.data.data) throw new Error(res.data.messages?.[0]);
        return res.data.data;
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { replace: true });
        }
        throw error;
      }
    },
  });

  const company = data?.client;

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/clients">Clients</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to={`/clients/company/${id}`}>
              {company?.client_firstname ?? "Company"}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 pt-2">
          <h5 className="text-2xl font-bold tracking-tight">Edit Company Client</h5>
          <CompanyEditForm defaultValues={company} isLoading={isLoading} />
        </div>
      </div>
    </>
  );
};

export default EditCompany;
