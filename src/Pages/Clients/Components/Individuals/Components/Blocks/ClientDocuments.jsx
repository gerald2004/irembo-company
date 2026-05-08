/* eslint-disable react/prop-types */
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  FileText,
  File,
  FileImage,
  BookText,
  FileChartColumn,
  Eye,
  Download,
  Loader2,
} from "lucide-react";
import AddDocuments from "../Forms/AddDocuments";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";

const ITEMS_PER_PAGE = 6;
const IMAGE_EXTS     = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

function getExt(url = "") {
  return (url.split(".").pop() || "").toLowerCase();
}

function FileIcon({ url, className = "w-8 h-8" }) {
  switch (getExt(url)) {
    case "doc":
    case "docx":  return <FileChartColumn className={`text-blue-600 ${className}`} />;
    case "pdf":   return <BookText        className={`text-red-600  ${className}`} />;
    case "txt":   return <FileText        className={`text-gray-600 ${className}`} />;
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":  return <FileImage       className={`text-green-600 ${className}`} />;
    default:      return <File            className={`text-gray-400 ${className}`} />;
  }
}

function DocCard({ doc, onPreview, onDelete, canDelete, isDeleting }) {
  const ext     = getExt(doc.document_url);
  const isImage = IMAGE_EXTS.has(ext);
  const [imgErr, setImgErr] = useState(false);
  const filename = doc.document_url.split("/").pop();

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden flex flex-col">
      {/* Thumbnail / icon area */}
      <div className="h-28 flex items-center justify-center bg-muted/40 overflow-hidden border-b">
        {isImage && !imgErr ? (
          <img
            src={doc.document_url}
            alt={doc.document_description || filename}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <FileIcon url={doc.document_url} className="w-10 h-10" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 px-3 pt-2 pb-1 min-w-0">
        <p className="text-xs font-medium truncate" title={doc.document_description}>
          {doc.document_description || "No description"}
        </p>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5" title={filename}>
          {filename}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-1 px-3 pb-3 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 flex-1"
          onClick={() => onPreview(doc)}
        >
          <Eye className="w-3.5 h-3.5" /> View
        </Button>

        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            className="h-7 text-xs gap-1 flex-1"
            onClick={() => onDelete(doc.document_id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            {isDeleting ? "..." : "Delete"}
          </Button>
        )}
      </div>
    </div>
  );
}

function PreviewModal({ doc, onClose }) {
  const ext      = getExt(doc.document_url);
  const isImage  = IMAGE_EXTS.has(ext);
  const isPdf    = ext === "pdf";
  const filename = doc.document_url.split("/").pop();
  const [imgErr, setImgErr] = useState(false);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-sm truncate pr-8" title={doc.document_description || filename}>
            {doc.document_description || filename}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto flex items-center justify-center min-h-0 py-2">
          {isPdf ? (
            <iframe
              src={doc.document_url}
              className="w-full h-[60vh] border rounded"
              title="PDF Preview"
            />
          ) : isImage && !imgErr ? (
            <img
              src={doc.document_url}
              alt={doc.document_description || filename}
              className="max-w-full max-h-[60vh] rounded shadow object-contain"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground py-10">
              <FileIcon url={doc.document_url} className="w-16 h-16" />
              <p className="text-sm">{imgErr ? "Image could not be loaded." : "Preview not available for this file type."}</p>
            </div>
          )}
        </div>

        <div className="shrink-0 flex justify-end pt-2 border-t">
          <a href={doc.document_url} target="_blank" rel="noopener noreferrer" download>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> Download
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const ClientDocuments = ({ isOpen, isClose }) => {
  const axiosPrivate = useAxiosPrivate();
  const { id: clientId } = useParams();
  const queryClient  = useQueryClient();
  const [previewDoc, setPreviewDoc]   = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { auth: { roles } } = useAuth();

  const { data: documents = [], isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["clientDocuments", clientId],
    queryFn: async ({ signal }) => {
      const response = await axiosPrivate.get(`/clients/documents/${clientId}`, { signal });
      return response.data.data.documents || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (docId) => axiosPrivate.delete(`/clients/${docId}/documents`),
    onMutate: async (docId) => {
      await queryClient.cancelQueries({ queryKey: ["clientDocuments", clientId] });
      const prev = queryClient.getQueryData(["clientDocuments", clientId]);
      queryClient.setQueryData(["clientDocuments", clientId], (old) =>
        old?.filter((d) => d.document_id !== docId)
      );
      return { prev };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(["clientDocuments", clientId], context.prev);
      toast({ title: "Deletion failed", variant: "destructive" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["clientDocuments", clientId] }),
  });

  const totalPages = Math.max(1, Math.ceil(documents.length / ITEMS_PER_PAGE));
  const paged      = documents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const canDelete  = hasPermission(roles, 100028);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4">
        {(isLoading || isRefetching) &&
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-lg" />
          ))
        }

        {!isLoading && !isRefetching && isError && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-6">
            Failed to load documents.
          </p>
        )}

        {!isLoading && !isRefetching && !isError && paged.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-6">
            No documents uploaded yet.
          </p>
        )}

        {!isLoading && !isRefetching && !isError &&
          paged.map((doc) => (
            <DocCard
              key={doc.document_id}
              doc={doc}
              onPreview={setPreviewDoc}
              onDelete={(id) => deleteMutation.mutate(id)}
              canDelete={canDelete}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === doc.document_id}
            />
          ))
        }

        <AddDocuments isOpen={isOpen} refetch={refetch} isClose={isClose} />
      </div>

      {documents.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-center gap-3 pb-4 text-sm">
          <Button variant="outline" size="sm" disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}>Previous</Button>
          <span className="text-muted-foreground tabular-nums">{currentPage} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </>
  );
};

export default ClientDocuments;
