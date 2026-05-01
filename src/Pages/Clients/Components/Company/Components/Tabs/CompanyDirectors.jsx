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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
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
import { Users, UserPlus, Pencil, Trash2, BadgeCheck, Percent } from "lucide-react";
import { NINVerifyInput } from "@/components/NINVerifyInput";
import { PhoneVerifyInput } from "@/components/PhoneVerifyInput";

const DIRECTOR_ROLES = [
  { value: "director",          label: "Director" },
  { value: "managing_director", label: "Managing Director" },
  { value: "chairperson",       label: "Chairperson" },
  { value: "ceo",               label: "CEO" },
  { value: "cfo",               label: "CFO" },
  { value: "cto",               label: "CTO" },
  { value: "secretary",         label: "Company Secretary" },
  { value: "other",             label: "Other" },
];

const Field = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium break-words">{value || "—"}</p>
  </div>
);

const roleLabel = (v) => DIRECTOR_ROLES.find((r) => r.value === v)?.label ?? v ?? "—";

/* ─── Director Form (used in both Add & Edit dialogs) ─────────────────────── */
const DirectorForm = ({ form, onSubmit, onClose, isBusy, title }) => {
  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = form;
  const isSignatory = watch("is_authorized_signatory");

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input {...register("director_firstname", { required: "Required" })} placeholder="First name" />
              {errors.director_firstname && <p className="text-xs text-red-500 mt-0.5">{errors.director_firstname.message}</p>}
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input {...register("director_lastname", { required: "Required" })} placeholder="Last name" />
              {errors.director_lastname && <p className="text-xs text-red-500 mt-0.5">{errors.director_lastname.message}</p>}
            </div>
            <div>
              <Label>Role</Label>
              <Select onValueChange={(v) => setValue("director_role", v)} defaultValue={watch("director_role")}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {DIRECTOR_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Identification / NIN</Label>
              <Controller
                name="director_identification"
                control={control}
                render={({ field }) => (
                  <NINVerifyInput
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onAccept={(v) => {
                      const parts = (v.name ?? "").split(" ");
                      if (parts[0]) setValue("director_firstname", parts[0]);
                      if (parts[1]) setValue("director_lastname", parts.slice(1).join(" "));
                    }}
                    error={errors.director_identification?.message}
                  />
                )}
              />
            </div>
            <div className="col-span-2">
              <Label>Contact</Label>
              <Controller
                name="director_contact"
                control={control}
                render={({ field }) => (
                  <PhoneVerifyInput
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onAccept={(r) => {
                      setValue("director_firstname", r.firstname);
                      setValue("director_lastname", r.lastname);
                    }}
                    error={errors.director_contact?.message}
                  />
                )}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input {...register("director_email")} placeholder="email@example.com" type="email" />
            </div>
            <div>
              <Label>Nationality</Label>
              <Input {...register("director_nationality")} placeholder="Nationality" />
            </div>
            <div>
              <Label>Ownership %</Label>
              <Input {...register("director_ownership_pct")} placeholder="e.g. 25" type="number" step="0.01" min="0" max="100" />
            </div>
            <div className="col-span-2 flex items-center justify-between border rounded-md px-4 py-3">
              <div>
                <p className="text-sm font-medium">Authorized Signatory</p>
                <p className="text-xs text-muted-foreground">This director can sign on behalf of the company</p>
              </div>
              <Switch
                checked={!!isSignatory}
                onCheckedChange={(v) => setValue("is_authorized_signatory", v ? 1 : 0)}
              />
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
const CompanyDirectors = () => {
  const { id } = useParams();
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const addForm = useForm();
  const editForm = useForm();

  /* fetch */
  const { data: directors = [], isLoading } = useQuery({
    queryKey: ["company-directors", id],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/clients/company/${id}/directors`);
      return res.data.data.directors ?? [];
    },
  });

  /* add */
  const addMutation = useMutation({
    mutationFn: (payload) => axiosPrivate.post(`/clients/company/${id}/directors`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-directors", id] });
      queryClient.invalidateQueries({ queryKey: ["company-client", id] });
      toast({ title: "Director added" });
      addForm.reset();
      setAddOpen(false);
    },
    onError: (err) =>
      toast({ title: "Error", variant: "destructive", description: err?.response?.data?.messages }),
  });

  /* edit */
  const editMutation = useMutation({
    mutationFn: ({ directorId, payload }) =>
      axiosPrivate.patch(`/clients/company/${id}/directors/${directorId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-directors", id] });
      toast({ title: "Director updated" });
      setEditTarget(null);
    },
    onError: (err) =>
      toast({ title: "Error", variant: "destructive", description: err?.response?.data?.messages }),
  });

  /* delete */
  const deleteMutation = useMutation({
    mutationFn: (directorId) =>
      axiosPrivate.delete(`/clients/company/${id}/directors/${directorId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-directors", id] });
      queryClient.invalidateQueries({ queryKey: ["company-client", id] });
      toast({ title: "Director removed" });
    },
    onError: () => toast({ title: "Failed to delete director", variant: "destructive" }),
  });

  const openEdit = (d) => {
    editForm.reset({
      director_firstname:      d.director_firstname,
      director_lastname:       d.director_lastname,
      director_role:           d.director_role,
      director_identification: d.director_identification,
      director_contact:        d.director_contact,
      director_email:          d.director_email,
      director_nationality:    d.director_nationality,
      director_ownership_pct:  d.director_ownership_pct,
      is_authorized_signatory: d.is_authorized_signatory,
    });
    setEditTarget(d);
  };

  return (
    <div className="max-w-5xl mx-auto p-5 space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Users className="w-4 h-4" /> Directors &amp; Signatories
          <span className="font-normal text-xs">({directors.length})</span>
        </h3>
        <Button size="sm" onClick={() => { addForm.reset(); setAddOpen(true); }}>
          <UserPlus className="w-4 h-4 mr-1.5" /> Add Director
        </Button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
        </div>
      ) : directors.length === 0 ? (
        <div className="text-center py-14 border rounded-lg">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No directors recorded.</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Add Director" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {directors.map((d) => (
            <div key={d.director_id} className="border rounded-lg p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              {/* Director header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {(d.director_firstname?.[0] ?? "") + (d.director_lastname?.[0] ?? "")}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{d.director_firstname} {d.director_lastname}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {roleLabel(d.director_role)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {d.is_authorized_signatory === 1 && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <BadgeCheck className="w-3 h-3" /> Authorized Signatory
                    </Badge>
                  )}
                  {d.director_ownership_pct != null && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Percent className="w-3 h-3" />{d.director_ownership_pct}%
                    </Badge>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(d)}>
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
                        <AlertDialogTitle>Remove Director?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove {d.director_firstname} {d.director_lastname} from the directors list.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => deleteMutation.mutate(d.director_id)}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Detail grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 border-t pt-4">
                <Field label="Identification" value={d.director_identification} />
                <Field label="Contact" value={d.director_contact} />
                <Field label="Email" value={d.director_email} />
                <Field label="Nationality" value={d.director_nationality} />
                {d.director_ownership_pct != null && (
                  <Field label="Ownership %" value={`${d.director_ownership_pct}%`} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Director dialog */}
      {addOpen && (
        <DirectorForm
          form={addForm}
          onSubmit={(data) => addMutation.mutate(data)}
          onClose={() => setAddOpen(false)}
          isBusy={addMutation.isPending}
          title="Add Director"
        />
      )}

      {/* Edit Director dialog */}
      {editTarget && (
        <DirectorForm
          form={editForm}
          onSubmit={(data) => editMutation.mutate({ directorId: editTarget.director_id, payload: data })}
          onClose={() => setEditTarget(null)}
          isBusy={editMutation.isPending}
          title="Edit Director"
        />
      )}
    </div>
  );
};

export default CompanyDirectors;
