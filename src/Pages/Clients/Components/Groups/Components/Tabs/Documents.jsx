import { Button } from "@/components/ui/button";
import ClientDocuments from "../Blocks/ClientDocuments";
import { useState } from "react";

const Documents = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
   const handleOpenModal = () => setIsModalOpen(true);
   const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div className="max-w-5xl mx-auto p-5 space-y-8">
      <Button size="sm" onClick={handleOpenModal} className="float-end">Add Document</Button>
      <ClientDocuments isOpen={isModalOpen}
      isClose={handleCloseModal} />
    </div>
  );
};

export default Documents;
