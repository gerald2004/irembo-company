/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { X } from "lucide-react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";

const PhotoEdit = ({ isOpen, onClose, refetch, defaultValues }) => {
  const axiosPrivate = useAxiosPrivate();
  const {
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm();

  const [preview, setPreview] = useState({
    photo: defaultValues?.photo || null,
    signature: defaultValues?.signature || null,
  });

  useEffect(() => {
    reset(defaultValues);
    setPreview({
      photo: defaultValues?.photo || null,
      signature: defaultValues?.signature || null,
    });
  }, [defaultValues, reset]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setValue(type, file);
    setPreview((prev) => ({
      ...prev,
      [type]: URL.createObjectURL(file),
    }));
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("executive_id", defaultValues.id);
    formData.append("client_id", defaultValues.client_id);

    if (data.photo instanceof File) {
      formData.append("file", data.photo);
      formData.append("file_type", "photo");
            const controller = new AbortController();

      try {
        await axiosPrivate.post(`clients/images/executives`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          signal: controller.signal,
        });
      } catch (err) {
        console.error("Error uploading photo", err);
      }
    }

    if (data.signature instanceof File) {
      const signatureForm = new FormData();
      signatureForm.append("file", data.signature);
      signatureForm.append("file_type", "signature");
      signatureForm.append("executive_id", defaultValues.id);
      signatureForm.append("client_id", defaultValues.client_id);
            const controller = new AbortController();

      try {
        await axiosPrivate.post(`clients/images/executives`, signatureForm, {
          headers: { "Content-Type": "multipart/form-data" },
          signal: controller.signal,
        });
      } catch (err) {
        console.error("Error uploading signature", err);
      }
    }

    toast({
      title: "Success",
      description: "Executive photo and signature updated.",
    });
    refetch();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Update Images</DialogTitle>
          <DialogDescription>
            Upload or preview executive photo and signature.
          </DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 opacity-70 hover:opacity-100"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Photo Upload */}
            <div>
              <Label htmlFor="photo">Photo</Label>
              {preview.photo && (
                <img
                  src={preview.photo}
                  alt="Executive Photo"
                  className="w-32 h-32 rounded-full object-cover mb-2 border"
                />
              )}
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "photo")}
              />
            </div>

            {/* Signature Upload */}
            <div>
              <Label htmlFor="signature">Signature</Label>
              {preview.signature && (
                <img
                  src={preview.signature}
                  alt="Executive Signature"
                  className="w-32 h-32 object-contain mb-2 border"
                />
              )}
              <Input
                id="signature"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "signature")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Update Images"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoEdit;
