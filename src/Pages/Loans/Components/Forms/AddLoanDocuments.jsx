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
import { Loader2, UploadCloud, FileCheck2 } from "lucide-react";

const AddLoanDocuments = ({ isOpen, isClose, refetch }) => {
  const axiosPrivate = useAxiosPrivate();
  const { loanid: loanId } = useParams();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const addDocumentMutation = useMutation({
    mutationFn: (formData) =>
      axiosPrivate.post("/loans/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: (res) => {
      toast({ title: "Document uploaded", description: res.data?.messages });
      queryClient.invalidateQueries({ queryKey: ["loanDocuments", loanId] });
      reset();
      setSelectedFile(null);
      refetch?.();
      isClose();
    },
    onError: (err) => {
      toast({
        title: "Upload failed",
        variant: "destructive",
        description: err?.response?.data?.messages?.[0] ?? "Could not upload document.",
      });
    },
  });

  const isPending = addDocumentMutation.isPending;

  const onSubmit = (data) => {
    if (!selectedFile) {
      toast({ title: "File required", variant: "destructive", description: "Please select a file to upload." });
      return;
    }
    const formData = new FormData();
    formData.append("document_description", data.document_description);
    formData.append("document_file", selectedFile);
    formData.append("loan_application_id", loanId);
    addDocumentMutation.mutate(formData);
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>Add a document for this loan application.</DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              onClick={isClose}
              disabled={isPending}
            >
              ×
            </button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <fieldset disabled={isPending} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="document_description">Description</Label>
              <Textarea
                id="document_description"
                placeholder="e.g. National ID, Business License…"
                rows={2}
                {...register("document_description", { required: "Description is required" })}
              />
              {errors.document_description && (
                <p className="text-xs text-destructive">{errors.document_description.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="document_file">File</Label>
              <label
                htmlFor="document_file"
                className={`flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                  ${selectedFile ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/40 bg-muted/30 hover:bg-muted/50"}`}
              >
                {selectedFile ? (
                  <>
                    <FileCheck2 className="w-6 h-6 text-primary" />
                    <span className="text-xs text-center px-2 font-medium text-primary truncate max-w-full">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{formatBytes(selectedFile.size)}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Click to select a file</span>
                    <span className="text-[10px] text-muted-foreground">PDF, DOC, DOCX, JPG, PNG, TXT</span>
                  </>
                )}
                <Input
                  id="document_file"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </fieldset>

          <DialogFooter>
            <Button type="submit" size="sm" disabled={isPending} className="gap-1.5 w-full sm:w-auto">
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLoanDocuments;
