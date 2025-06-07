/* eslint-disable react/prop-types */
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { useState } from "react";

const AddDocuments = ({ isOpen, isClose, refetch }) => {
  const axiosPrivate = useAxiosPrivate();
  const { id: clientId } = useParams();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // ✅ Mutation for submitting document
  const addDocumentMutation = useMutation({
    mutationFn: async (formData) => {
      const controller = new AbortController();
      const response = await axiosPrivate.post(
        `/clients/documents/${clientId}`,
        formData,

        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          signal: controller.signal,
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.messages,
      });
      queryClient.invalidateQueries(["clientDocuments", clientId]); // Refresh documents list
      reset();
      setSelectedFile(null);
      isClose();
      refetch();
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.messages || "No server response";
      toast({
        title: "Error",
        variant: "destructive",
        description: errorMessage,
      });
    },
  });

  // ✅ Handle Form Submission
  const onSubmit = (data) => {
    if (!selectedFile) {
      toast({
        title: "File Required",
        variant: "destructive",
        description: "Please upload a document file.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("document_description", data.document_description);
    formData.append("document_file", selectedFile);

    addDocumentMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Add a new document for this client.
          </DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              onClick={isClose}
            >
              ×
            </button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Document Description */}
          <div>
            <Label htmlFor="document_description">Document Description</Label>
            <Textarea
              id="document_description"
              placeholder="Describe the document"
              {...register("document_description", {
                required: "Document description is required",
              })}
            />
            {errors.document_description && (
              <p className="text-red-500 text-sm">
                {errors.document_description.message}
              </p>
            )}
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="document_file">Upload Document</Label>
            <Input
              id="document_file"
              type="file"
              accept=".pdf,.doc,.docx,.txt,.jpg,.png"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
            {selectedFile && (
              <p className="text-sm text-green-600">
                File selected: {selectedFile.name}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              size={"sm"}
              disabled={isSubmitting || addDocumentMutation.isLoading}
            >
              {isSubmitting || addDocumentMutation.isLoading
                ? "Uploading..."
                : "Upload Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDocuments;
