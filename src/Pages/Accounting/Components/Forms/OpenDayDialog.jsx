/* eslint-disable react/prop-types */
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import * as React from "react";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // <- Reason field
import { DateField } from "@/components/DateField";
import { X } from "lucide-react";

export default function OpenDayDialog({
  isOpen,
  onClose,
  defaultDate,
  defaultScope, // 'branch' | 'business'
  defaultBranchId,
  isSaccoUser, // gate the scope select
  onSuccess,
}) {
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();

  // session-derived
  const user = auth?.user ?? {};
  const myBranchId = auth?.current_branch_id ?? user?.branch_id ?? null;
  const allowedFromSession = Array.isArray(auth?.allowed_branches)
    ? auth.allowed_branches
    : [];

  // branches shown in dropdown (SACCO users only)
  const [branches, setBranches] = React.useState([]);
  const [loadingBranches, setLoadingBranches] = React.useState(false);

  const norm = React.useCallback(
    (b) => ({
      id: b.id ?? b.branch_id ?? b?.branchId,
      name:
        b.name ??
        b.branch_name ??
        b?.branchName ??
        `Branch #${b.id ?? b.branch_id ?? b?.branchId}`,
    }),
    []
  );

  React.useEffect(() => {
    let abort = new AbortController();
    async function load() {
      if (!isSaccoUser) {
        // Branch user → restrict to session branch only (no selector)
        setBranches([]);
        return;
      }
      try {
        setLoadingBranches(true);
        if (allowedFromSession.length) {
          setBranches(allowedFromSession.map(norm));
        } else {
          const res = await axiosPrivate.get("/settings/branches", {
            signal: abort.signal,
          });
          const raw = res?.data?.data?.branches ?? [];
          setBranches(raw.map(norm));
        }
      } catch (e) {
        console.log(e);
        setBranches([]);
      } finally {
        setLoadingBranches(false);
      }
    }
    load();
    return () => abort.abort();
  }, [axiosPrivate, isSaccoUser, allowedFromSession, norm]);

  const { control, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      business_date: defaultDate || new Date().toISOString().slice(0, 10),
      scope: isSaccoUser ? defaultScope || "business" : "branch",
      branch_id: defaultBranchId
        ? String(defaultBranchId)
        : myBranchId
        ? String(myBranchId)
        : "",
      notes: "", // <- Reason/notes value
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        business_date: defaultDate || new Date().toISOString().slice(0, 10),
        scope: isSaccoUser ? defaultScope || "business" : "branch",
        branch_id: defaultBranchId
          ? String(defaultBranchId)
          : myBranchId
          ? String(myBranchId)
          : "",
        notes: "",
      });
    }
  }, [
    isOpen,
    defaultDate,
    defaultScope,
    defaultBranchId,
    isSaccoUser,
    myBranchId,
    reset,
  ]);

  const scope = watch("scope");

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload) => {
      const controller = new AbortController();
      const res = await axiosPrivate.post(
        "/accounting/open-business-days",
        payload,
        { signal: controller.signal }
      );
      return res?.data?.data;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Business day opened." });
      onSuccess?.();
    },
    onError: (err) => {
      const msg = err?.response?.data?.messages || "No server response";
      toast({
        title: "Unable to open",
        variant: "destructive",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
      });
    },
  });

  const onSubmit = (data) => {
    const payload =
      isSaccoUser && data.scope === "business"
        ? {
            business_date: data.business_date,
            scope: "business",
            notes: data.notes || undefined, // <- send reason
          }
        : {
            business_date: data.business_date,
            scope: "branch",
            branch_id: data.branch_id
              ? parseInt(data.branch_id, 10)
              : undefined,
            notes: data.notes || undefined, // <- send reason
          };

    mutate(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Open Business Day</DialogTitle>
          <DialogDescription>
            Snapshot all tills/safes/banks at the start of the selected day and
            scope.
          </DialogDescription>

          {/* Close icon */}
          <DialogClose asChild>
            <button
              type="button"
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
              aria-label="Close"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Controller
                name="business_date"
                control={control}
                render={({ field }) => (
                  <DateField
                    label="Date"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Scope select only for SACCO users */}
            {isSaccoUser && (
              <div>
                <Label>Scope</Label>
                <Controller
                  name="scope"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Scope" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="branch">Branch</SelectItem>
                        <SelectItem value="business">Whole Business</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>

          {/* Branch selector when scope is branch (SACCO users only).
              Branch users never see this; they are fixed to their branch. */}
          {isSaccoUser && scope === "branch" && (
            <div>
              <Label>Branch</Label>
              <Controller
                name="branch_id"
                control={control}
                rules={{ required: "Branch is required for Branch scope" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingBranches ? "Loading…" : "Select Branch"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={String(b.id)} value={String(b.id)}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {/* Reason / Notes */}
          <div>
            <Label>Reason (optional)</Label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <Textarea
                  placeholder="Why are you opening this business day? (optional)"
                  className="min-h-[88px]"
                  {...field}
                />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Opening..." : "Open Day"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
