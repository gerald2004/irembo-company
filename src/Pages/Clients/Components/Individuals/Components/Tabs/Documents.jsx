import { Button } from "@/components/ui/button";
import ClientDocuments from "../Blocks/ClientDocuments";
import { useState } from "react";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";
const Documents = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const { auth } = useAuth();
  const roles = auth?.roles;
  return (
    <div className="max-w-5xl mx-auto p-5 space-y-8">
      {hasPermission(roles, 100026) && (
        <Button size="sm" onClick={handleOpenModal} className="float-end">
          Add Document
        </Button>
      )}
      {hasPermission(roles, 100025) && (
        <ClientDocuments isOpen={isModalOpen} isClose={handleCloseModal} />
      )}
    </div>
  );
};

export default Documents;
