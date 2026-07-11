import { Badge } from "@/components/ui/badge";

export const salaryAdvanceStatusBadge = (status) => {
  const s = (status || "").toLowerCase();
  const cls =
    {
      pending: "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100",
      approved: "bg-green-100 text-green-800 border-green-300 hover:bg-green-100",
      disbursed:
        "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100",
      rejected: "bg-red-100 text-red-700 border-red-300 hover:bg-red-100",
      paid_off: "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-100",
      writtenoff: "bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-800",
      cancelled: "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-100",
    }[s] || "";
  return (
    <Badge variant="outline" className={`capitalize text-xs font-medium ${cls}`}>
      {status}
    </Badge>
  );
};
