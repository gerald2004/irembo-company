import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import JointAccountEditForm from "./Components/Forms/JointAccountEditForm";

const EditJointAccount = () => {
  const axiosPrivate = useAxiosPrivate();
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["joint-account-client", id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/clients/joint-account/${id}`);
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

  const client = data?.client;
  const primaryName = [client?.client_firstname, client?.client_lastname].filter(Boolean).join(" ");

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
            <BreadcrumbLink to={`/clients/joint-account/${id}`}>
              {primaryName || "Joint Account"}
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
          <h5 className="text-2xl font-bold tracking-tight">Edit Joint Account</h5>
          <JointAccountEditForm defaultValues={client} isLoading={isLoading} />
        </div>
      </div>
    </>
  );
};

export default EditJointAccount;
