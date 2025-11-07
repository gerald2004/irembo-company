/* eslint-disable react/prop-types */
import { useForm, Controller } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function CloseDayDialog({
  isOpen,
  onClose,
  defaultDate,
  defaultScope, // 'branch' | 'business'
  defaultBranchId,
  onSuccess,
}) {
  const axiosPrivate = useAxiosPrivate();

  // who am I? (to lock branch users)
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const ctrl = new AbortController();
      const r = await axiosPrivate.get("/auth/me", { signal: ctrl.signal });
      return r?.data?.data ?? r?.data ?? {};
    },
  });
  const dataPrivilege = String(
    me?.data_privilege || me?.user?.data_privilege || "sacco"
  ).toLowerCase();
  const myBranchId = me?.branch_id ?? me?.user?.branch_id ?? null;
  const isBranchUser = dataPrivilege === "branch";

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const controller = new AbortController();
      const res = await axiosPrivate.get("/settings/branches", {
        signal: controller.signal,
      });
      return res?.data?.data?.branches ?? [];
    },
  });

  const { control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      business_date: defaultDate || new Date().toISOString().slice(0, 10),
      scope: defaultScope || (isBranchUser ? "branch" : "business"),
      branch_id: isBranchUser
        ? myBranchId
          ? String(myBranchId)
          : ""
        : defaultBranchId
        ? String(defaultBranchId)
        : "",
      notes: "",
    },
  });

  const scope = watch("scope");
  // lock branch users
  if (isBranchUser && scope !== "branch") setValue("scope", "branch");
  if (isBranchUser && myBranchId && watch("branch_id") !== String(myBranchId)) {
    setValue("branch_id", String(myBranchId));
  }

  const { mutate, isLoading } = useMutation({
    mutationFn: async (payload) => {
      const controller = new AbortController();
      const res = await axiosPrivate.post(
        "/accounting/close-business-days",
        payload,
        {
          signal: controller.signal,
        }
      );
      return res?.data?.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Business day closed successfully.",
      });
      onSuccess?.();
    },
    onError: (err) => {
      const msg = err?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        description: Array.isArray(msg) ? msg.join(", ") : String(msg),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data) => {
    const payload = {
      business_date: data.business_date,
      // backend accepts “business” or “branch”
      scope: data.scope,
      ...(data.scope === "branch"
        ? { branch_id: data.branch_id ? parseInt(data.branch_id) : undefined }
        : {}),
      notes: data.notes || undefined,
    };
    mutate(payload);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Close Business Day</DialogTitle>
          <DialogDescription>
            Commit the closing snapshot (balances as of end-of-day) and lock the
            opening.
          </DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Controller
                name="business_date"
                control={control}
                render={({ field }) => <Input type="date" {...field} />}
              />
            </div>
            <div>
              <Label>Scope</Label>
              <Controller
                name="scope"
                control={control}
                render={({ field }) => (
                  <Select
                    value={isBranchUser ? "branch" : field.value}
                    onValueChange={field.onChange}
                    disabled={isBranchUser}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="branch">Branch</SelectItem>
                      {!isBranchUser && (
                        <SelectItem value="business">Whole Business</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {watch("scope") === "branch" && (
            <div>
              <Label>Branch</Label>
              <Controller
                name="branch_id"
                control={control}
                rules={{ required: "Branch is required for Branch scope" }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isBranchUser}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem
                          key={String(b.branch_id ?? b.id)}
                          value={String(b.branch_id ?? b.id)}
                        >
                          {b.branch_name ?? b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <div>
            <Label>Notes (optional)</Label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <Input placeholder="Anything to note..." {...field} />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Closing..." : "Confirm Close Day"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
