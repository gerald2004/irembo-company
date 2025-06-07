/* eslint-disable react/prop-types */
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const SendEmail = ({ isOpen, onClose, refetch }) => {
  const axiosPrivate = useAxiosPrivate();
  const { id: clientId } = useParams(); // ✅ Get client_id from params

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    const controller = new AbortController();

    try {
      const payload = { ...data, client_id: clientId };
      const response = await axiosPrivate.post(
        `/communication/emails`,
        payload,
        { signal: controller.signal }
      );
      toast({
        title: "Success",
        description: response.data.messages,
      });
      reset();
      refetch();
      onClose();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: errorMessage,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>Send email to this client.</DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-1">
            <div>
              <Label htmlFor="email_subject">Subject</Label>
              <Input
                id="email_subject"
                placeholder="Enter Subject"
                {...register("email_subject", {
                  required: "Subject is required",
                })}
              />
              {errors.email_subject && (
                <p className="text-red-500 text-sm">
                  {errors.email_subject.message}
                </p>
              )}
            </div>
            <div className="col-span-full">
              <Label htmlFor="email_message">Message</Label>
              <Textarea
                id="email_message"
                placeholder="Enter Message"
                {...register("email_message", {
                  required: "Message is required",
                })}
              />
              {errors.email_message && (
                <p className="text-red-500 text-sm">
                  {errors.email_message.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending Email Please Wait..." : "Send Email"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SendEmail;
