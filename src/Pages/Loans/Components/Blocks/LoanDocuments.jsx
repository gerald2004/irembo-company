/* eslint-disable react/prop-types */
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  FileText,
  File,
  FileImage,
  BookText,
  FileChartColumn,
  Eye,
} from "lucide-react";
import AddLoanDocuments from "../Forms/AddLoanDocuments";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";

const ITEMS_PER_PAGE = 6; // Number of items per page

const LoanDocuments = ({ isOpen, isClose }) => {
  const axiosPrivate = useAxiosPrivate();
  const { loanid: loanId } = useParams();
  const queryClient = useQueryClient();
  const [previewDoc, setPreviewDoc] = useState(null); // Stores selected document for preview
  const [currentPage, setCurrentPage] = useState(1); // Pagination state

  // ✅ Fetch All Documents Once
  const {
    data: documents,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["loanDocuments", loanId],
    _queryFn: async () => {
      const controller = new AbortController();

      const response = await axiosPrivate.get(`/loans/${loanId}/documents`, {
        signal: controller.signal,
      });
      return response.data.data.documents || [];
    },
    get queryFn() {
      return this._queryFn;
    },
    set queryFn(value) {
      this._queryFn = value;
    },
  });

  // ✅ Delete Document Mutation
  const deleteMutation = useMutation({
    mutationFn: async (docId) => {
      const controller = new AbortController();

      await axiosPrivate.delete(`/loans/documents/${docId}`, {
        signal: controller.signal,
      });
      return docId;
    },
    onMutate: async (docId) => {
      await queryClient.cancelQueries(["loanDocuments", loanId]);
      const previousDocs = queryClient.getQueryData(["loanDocuments", loanId]);

      queryClient.setQueryData(["loanDocuments", loanId], (oldDocs) =>
        oldDocs?.filter((doc) => doc.document_id !== docId)
      );

      return { previousDocs };
    },
    onError: (err, docId, context) => {
      queryClient.setQueryData(["loanDocuments", loanId], context.previousDocs);
      toast({
        title: "Deletion Failed",
        variant: "destructive",
        description: "Could not delete document.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries(["loanDocuments", loanId]);
    },
  });

  // ✅ Determine file type based on extension
  const getFileIcon = (filename) => {
    const extension = filename.split(".").pop().toLowerCase();
    switch (extension) {
      case "doc":
      case "docx":
        return <FileChartColumn className="text-blue-600 w-8 h-8" />;
      case "pdf":
        return <BookText className="text-red-600 w-8 h-8" />;
      case "txt":
        return <FileText className="text-gray-600 w-8 h-8" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <FileImage className="text-green-600 w-8 h-8" />;
      default:
        return <File className="text-gray-400 w-8 h-8" />;
    }
  };

  // ✅ Function to Preview Document (Images & PDFs)
  const handlePreview = (doc) => {
    setPreviewDoc(doc);
  };

  // ✅ Paginate Documents
  const totalPages = Math.ceil((documents?.length || 0) / ITEMS_PER_PAGE);
  const paginatedDocuments = documents?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const {
    auth: { roles },
  } = useAuth();
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-4">
        {/* ✅ Show Loading State */}
        {(isLoading || isRefetching) && (
          <>
            <Skeleton className="h-[180px] w-[190px]" />
            <Skeleton className="h-[180px] w-[190px]" />
            <Skeleton className="h-[180px] w-[190px]" />
            <Skeleton className="h-[180px] w-[190px]" />
          </>
        )}

        {/* ✅ Show Error State */}
        {(isError || error) && (
          <>
            <div className="text-center col-span-full">No documents.</div>
          </>
        )}

        {/* ✅ Show Documents */}
        {!isLoading &&
          !isRefetching &&
          !isError &&
          paginatedDocuments?.map((doc) => {
            return (
              <Card key={doc.document_id} className="relative shadow-md">
                <CardHeader className="flex flex-col items-center">
                  {getFileIcon(doc.document_url)}
                  <p className="text-sm font-medium mt-2">
                    {doc.document_description || "No description"}
                  </p>
                </CardHeader>
                <CardContent className="text-center text-sm truncate">
                  <a
                    href={doc.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {doc.document_url.split("/").pop()}
                  </a>
                </CardContent>
                <CardFooter className="flex justify-between">
                  {/* ✅ Preview Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handlePreview(doc)}
                  >
                    <Eye className="w-4 h-4" /> Preview
                  </Button>

                  {/* ✅ Delete Button */}
                  {hasPermission(roles, 100091) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => deleteMutation.mutate(doc.document_id)}
                      disabled={deleteMutation.isLoading}
                    >
                      <Trash2 className="w-4 h-4" />{" "}
                      {deleteMutation.isLoading ? "Deleting..." : "Delete"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}

        <AddLoanDocuments isOpen={isOpen} refetch={refetch} isClose={isClose} />
      </div>

      {/* ✅ Pagination Controls */}
      <div className="flex justify-center space-x-4 mt-6">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Previous
        </Button>
        <span className="flex items-center text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </Button>
      </div>

      {/* ✅ Document Preview Modal (PDF & Images) */}
      {previewDoc && (
        <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="max-w-[800]">
            <DialogHeader>
              <DialogTitle>Document Preview</DialogTitle>
              <DialogClose asChild>
                <button
                  className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                  onClick={() => setPreviewDoc(null)}
                >
                  ×
                </button>
              </DialogClose>
            </DialogHeader>

            <div className="flex justify-center">
              {previewDoc.document_url.endsWith(".pdf") ? (
                <iframe
                  src={previewDoc.document_url}
                  className="w-full h-[500px] border rounded-md"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewDoc.document_url}
                  alt="Preview"
                  className="max-w-full h-[500px] rounded-md shadow-md"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default LoanDocuments;
