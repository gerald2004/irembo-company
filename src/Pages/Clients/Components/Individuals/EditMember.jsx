import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useNavigate, useParams } from "react-router-dom";
import ClientEditForm from "./Components/Forms/ClientEditForm";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

const EditMember = () => {
  const axiosPrivate = useAxiosPrivate();
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["individuals-data", id],
    queryFn: async () => {
            const controller = new AbortController();

      const fetchURL = `/clients/individual/${id}`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        if (!response.data.data) {
          throw new Error(response?.data?.message);
        }
        return response.data.data.client;
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw new Error(error?.response?.data?.message);
      }
    },
  });
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
            <BreadcrumbLink to={`/clients/individual/${id}`}>
              {data.client_firstname} {data.client_lastname}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Client</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Edit Individual Client
            </h5>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4 p-0 pt-2">
              <ClientEditForm
                defaultValues={data}
                isLoading={isLoading}
                refetch={refetch}
                isRefetching={isRefetching}
                isError={isError}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditMember;
