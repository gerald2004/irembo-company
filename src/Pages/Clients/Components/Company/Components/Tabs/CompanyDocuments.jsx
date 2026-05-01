import { useState } from "react";
import { Button } from "@/components/ui/button";
import ClientDocuments from "@/Pages/Clients/Components/Groups/Components/Blocks/ClientDocuments";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";

const CompanyDocuments = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { auth } = useAuth();
  const roles = auth?.roles;

  return (
    <div className="max-w-5xl mx-auto p-5 space-y-8">
      {hasPermission(roles, 100026) && (
        <Button size="sm" onClick={() => setIsModalOpen(true)} className="float-end">
          Add Document
        </Button>
      )}
      {hasPermission(roles, 100025) && (
        <ClientDocuments isOpen={isModalOpen} isClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};

export default CompanyDocuments;
