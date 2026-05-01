import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { NINVerifyInput } from "@/components/NINVerifyInput";
import { PhoneVerifyInput } from "@/components/PhoneVerifyInput";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users2, UserPlus, Pencil, Trash2, Crown } from "lucide-react";
import { formatDateTimestamp } from "@/lib/utils";

const GENDERS = ["male", "female", "other"];
const RELATIONSHIPS = ["spouse", "sibling", "parent", "child", "partner", "other"];

const Field = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium break-words">{value || "—"}</p>
  </div>
);

/* ─── Holder Form ─────────────────────────────────────────────────────────── */
const HolderForm = ({ form, onSubmit, onClose, isBusy, title }) => {
  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = form;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[580px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input {...register("holder_firstname", { required: "Required" })} placeholder="First name" />
              {errors.holder_firstname && <p className="text-xs text-red-500 mt-0.5">{errors.holder_firstname.message}</p>}
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input {...register("holder_lastname", { required: "Required" })} placeholder="Last name" />
              {errors.holder_lastname && <p className="text-xs text-red-500 mt-0.5">{errors.holder_lastname.message}</p>}
            </div>
            <div className="col-span-2">
              <Label>Middle Name</Label>
              <Input {...register("holder_middlename")} placeholder="Middle name (optional)" />
            </div>
            <div className="col-span-2">
              <Label>Identification / NIN *</Label>
              <Controller
                name="holder_identification"
                control={control}
                rules={{ required: "Required" }}
                render={({ field }) => (
                  <NINVerifyInput
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onAccept={(v) => {
                      const parts = (v.name ?? "").split(" ");
                      if (parts[0]) setValue("holder_firstname", parts[0]);
                      if (parts[1]) setValue("holder_lastname", parts.slice(1).join(" "));
                      if (v.date_of_birth) setValue("holder_date_of_birth", v.date_of_birth);
                    }}
                    error={errors.holder_identification?.message}
                  />
                )}
              />
            </div>
            <div>
              <Label>Gender *</Label>
              <Select onValueChange={(v) => setValue("holder_gender", v)} defaultValue={watch("holder_gender")}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g} className="capitalize">{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.holder_gender && <p className="text-xs text-red-500 mt-0.5">{errors.holder_gender.message}</p>}
            </div>
            <div>
              <Label>Date of Birth *</Label>
              <Input type="date" {...register("holder_date_of_birth", { required: "Required" })} />
              {errors.holder_date_of_birth && <p className="text-xs text-red-500 mt-0.5">{errors.holder_date_of_birth.message}</p>}
            </div>
            <div>
              <Label>Relationship</Label>
              <Select onValueChange={(v) => setValue("holder_relationship", v)} defaultValue={watch("holder_relationship")}>
                <SelectTrigger><SelectValue placeholder="Relationship" /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Contact</Label>
              <Controller
                name="holder_contact"
                control={control}
                render={({ field }) => (
                  <PhoneVerifyInput
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onAccept={(r) => {
                      setValue("holder_firstname", r.firstname);
                      setValue("holder_lastname", r.lastname);
                    }}
                    error={errors.holder_contact?.message}
                  />
                )}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input {...register("holder_email")} placeholder="email@example.com" type="email" />
            </div>
            <div className="col-span-2">
              <Label>Address *</Label>
              <Input {...register("holder_address", { required: "Required" })} placeholder="Physical address" />
              {errors.holder_address && <p className="text-xs text-red-500 mt-0.5">{errors.holder_address.message}</p>}
            </div>
            <div>
              <Label>Ownership %</Label>
              <Input {...register("ownership_percentage")} type="number" step="0.01" min="0" max="100" placeholder="e.g. 50" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isBusy}>{isBusy ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ─── Main Component ──────────────────────────────────────────────────────── */
const JointHolders = () => {
  const { id } = useParams();
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const addForm = useForm();
  const editForm = useForm();

  /* fetch */
  const { data: holders = [], isLoading } = useQuery({
    queryKey: ["joint-holders", id],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/clients/joint-account/${id}/holders`);
      return res.data.data.holders ?? [];
    },
  });

  /* add */
  const addMutation = useMutation({
    mutationFn: (payload) => axiosPrivate.post(`/clients/joint-account/${id}/holders`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["joint-holders", id] });
      queryClient.invalidateQueries({ queryKey: ["joint-account-client", id] });
      toast({ title: "Holder added" });
      addForm.reset();
      setAddOpen(false);
    },
    onError: (err) =>
      toast({ title: "Error", variant: "destructive", description: err?.response?.data?.messages }),
  });

  /* edit */
  const editMutation = useMutation({
    mutationFn: ({ holderId, payload }) =>
      axiosPrivate.patch(`/clients/joint-account/${id}/holders/${holderId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["joint-holders", id] });
      toast({ title: "Holder updated" });
      setEditTarget(null);
    },
    onError: (err) =>
      toast({ title: "Error", variant: "destructive", description: err?.response?.data?.messages }),
  });

  /* delete */
  const deleteMutation = useMutation({
    mutationFn: (holderId) =>
      axiosPrivate.delete(`/clients/joint-account/${id}/holders/${holderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["joint-holders", id] });
      queryClient.invalidateQueries({ queryKey: ["joint-account-client", id] });
      toast({ title: "Holder removed" });
    },
    onError: (err) =>
      toast({ title: "Error", variant: "destructive", description: err?.response?.data?.messages }),
  });

  const openEdit = (h) => {
    editForm.reset({
      holder_firstname:     h.holder_firstname,
      holder_lastname:      h.holder_lastname,
      holder_middlename:    h.holder_middlename,
      holder_contact:       h.holder_contact,
      holder_email:         h.holder_email,
      holder_address:       h.holder_address,
      holder_relationship:  h.holder_relationship,
      ownership_percentage: h.ownership_percentage,
    });
    setEditTarget(h);
  };

  const nonPrimary = holders.filter((h) => h.is_primary !== 1);

  return (
    <div className="max-w-5xl mx-auto p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Users2 className="w-4 h-4" /> Account Holders
          <span className="font-normal text-xs">({holders.length})</span>
        </h3>
        <Button size="sm" onClick={() => { addForm.reset(); setAddOpen(true); }}>
          <UserPlus className="w-4 h-4 mr-1.5" /> Add Holder
        </Button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-36 w-full rounded-lg" />)}
        </div>
      ) : holders.length === 0 ? (
        <div className="text-center py-14 border rounded-lg">
          <Users2 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No additional holders recorded.</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Add Holder" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {holders.map((h) => {
            const holderName = [h.holder_firstname, h.holder_middlename, h.holder_lastname]
              .filter(Boolean).join(" ");
            const isPrimary = h.is_primary === 1;

            return (
              <div key={h.joint_holder_id} className="border rounded-lg p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                {/* Holder header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {(h.holder_firstname?.[0] ?? "") + (h.holder_lastname?.[0] ?? "")}
                    </div>
                    <div>
                      <p className="font-semibold text-sm capitalize">{holderName}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {h.holder_relationship || "Holder"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPrimary && (
                      <Badge className="gap-1 text-xs">
                        <Crown className="w-3 h-3" /> Primary Holder
                      </Badge>
                    )}
                    {h.ownership_percentage != null && (
                      <Badge variant="secondary" className="text-xs">
                        {h.ownership_percentage}% ownership
                      </Badge>
                    )}
                    {!isPrimary && (
                      <>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(h)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Holder?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove {holderName} from the joint account.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => deleteMutation.mutate(h.joint_holder_id)}
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>

                {/* Detail grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 border-t pt-4">
                  <Field label="Identification" value={h.holder_identification} />
                  <Field label="Date of Birth" value={formatDateTimestamp(h.holder_date_of_birth)} />
                  <Field label="Gender" value={h.holder_gender} />
                  <Field label="Contact" value={h.holder_contact} />
                  <Field label="Email" value={h.holder_email} />
                  <Field label="Address" value={h.holder_address} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Holder dialog */}
      {addOpen && (
        <HolderForm
          form={addForm}
          onSubmit={(data) => addMutation.mutate(data)}
          onClose={() => setAddOpen(false)}
          isBusy={addMutation.isPending}
          title="Add Joint Holder"
        />
      )}

      {/* Edit Holder dialog */}
      {editTarget && (
        <HolderForm
          form={editForm}
          onSubmit={(data) => editMutation.mutate({ holderId: editTarget.joint_holder_id, payload: data })}
          onClose={() => setEditTarget(null)}
          isBusy={editMutation.isPending}
          title="Edit Holder"
        />
      )}
    </div>
  );
};

export default JointHolders;
