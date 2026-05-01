/* eslint-disable react/prop-types */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Plus, Trash2, X, CalendarDays } from "lucide-react";
import { DateField } from "@/components/DateField";
import { format, parseISO } from "date-fns";

function AddHolidayDialog({ isOpen, onClose, onSuccess }) {
  const axiosPrivate = useAxiosPrivate();
  const [form, setForm] = useState({
    holiday_date: new Date().toISOString().slice(0, 10),
    holiday_name: "",
    description:  "",
    is_recurring: false,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axiosPrivate.post("/hr/holidays", form);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: "Added", description: "Holiday added to calendar" });
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.response?.data?.messages ?? "Failed to add holiday",
        variant: "destructive",
      });
    },
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Add Public Holiday</DialogTitle>
          <DialogClose asChild>
            <button type="button" onClick={onClose} className="absolute right-4 top-4 opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="space-y-4">
          <DateField label="Holiday Date" value={form.holiday_date} onChange={(v) => set("holiday_date", v)} />
          <div>
            <Label>Holiday Name *</Label>
            <Input
              placeholder="e.g. Independence Day"
              value={form.holiday_name}
              onChange={(e) => set("holiday_name", e.target.value)}
            />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea
              placeholder="Short description..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="min-h-[60px]"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={form.is_recurring}
              onCheckedChange={(v) => set("is_recurring", v)}
              id="recurring-switch"
            />
            <Label htmlFor="recurring-switch" className="cursor-pointer">
              Recurring yearly (repeats every year on the same date)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutate()} disabled={isPending || !form.holiday_name.trim()}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Holiday
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PublicHolidays() {
  const axiosPrivate = useAxiosPrivate();
  const queryClient  = useQueryClient();
  const thisYear     = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [showDialog, setShowDialog] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["public-holidays", year],
    queryFn: async () => {
      const res = await axiosPrivate.get("/hr/holidays", { params: { year } });
      return res.data?.data ?? {};
    },
  });

  const { mutate: deleteHoliday, isPending: isDeleting } = useMutation({
    mutationFn: async (id) => {
      const res = await axiosPrivate.delete(`/hr/holidays?holiday_id=${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Holiday removed" });
      queryClient.invalidateQueries({ queryKey: ["public-holidays"] });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.response?.data?.messages ?? "Failed to delete",
        variant: "destructive",
      });
    },
  });

  const holidays = data?.holidays ?? [];

  // Build set of holiday dates for calendar highlighting
  const holidayDates = holidays.map((h) => {
    try { return parseISO(h.holiday_date); } catch { return null; }
  }).filter(Boolean);

  const isHoliday = (d) => holidayDates.some(
    (h) => h.getFullYear() === d.getFullYear() && h.getMonth() === d.getMonth() && h.getDate() === d.getDate()
  );

  const calendarMonth = new Date(year, 0, 1);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Public Holidays</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-4 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setYear((y) => y - 1)}>‹</Button>
            <span className="font-semibold text-lg w-14 text-center">{year}</span>
            <Button variant="outline" size="icon" onClick={() => setYear((y) => y + 1)}>›</Button>
          </div>
          <Badge variant="secondary" className="gap-1">
            <CalendarDays className="h-3 w-3" /> {holidays.length} holidays
          </Badge>
          <Button size="sm" className="ml-auto gap-1" onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4" /> Add Holiday
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar grid */}
          <div className="space-y-4">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((monthIdx) => (
              <div key={monthIdx} className="border rounded-md p-3">
                <p className="text-sm font-semibold mb-2 text-muted-foreground">
                  {new Date(year, monthIdx).toLocaleString("default", { month: "long" })} {year}
                </p>
                <Calendar
                  mode="multiple"
                  month={new Date(year, monthIdx)}
                  selected={holidayDates.filter((d) => d.getMonth() === monthIdx && d.getFullYear() === year)}
                  className="p-0"
                  classNames={{
                    nav: "hidden",
                    caption: "hidden",
                    day_selected: "bg-red-500 text-white hover:bg-red-500",
                  }}
                />
              </div>
            ))}
          </div>

          {/* List */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Holiday List — {year}</h3>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="h-12 rounded bg-muted animate-pulse" />
              ))
            ) : holidays.length === 0 ? (
              <p className="text-muted-foreground text-sm">No holidays set for {year}.</p>
            ) : (
              holidays.map((h) => (
                <div
                  key={h.holiday_id ?? h.holiday_date}
                  className="flex items-center justify-between px-3 py-2 rounded-md border bg-card"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{h.holiday_name}</span>
                      {h.is_recurring && (
                        <Badge variant="outline" className="text-[10px] h-4">Recurring</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {h.holiday_date
                        ? format(parseISO(h.holiday_date), "EEEE, d MMMM yyyy")
                        : h.holiday_date}
                    </p>
                    {h.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{h.description}</p>
                    )}
                  </div>
                  {h.holiday_id && (
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => deleteHoliday(h.holiday_id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showDialog && (
        <AddHolidayDialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          onSuccess={refetch}
        />
      )}
    </>
  );
}
