import { Card, CardContent } from "@/components/ui/card";

const StatCard = ({ label, value, subtitle, icon: Icon, colorClass, bgClass }) => (
  <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{label}</p>
          <p className="text-2xl font-bold tabular-nums tracking-tight">{value ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${bgClass}`}>
          <Icon className={`h-5 w-5 ${colorClass}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default StatCard;
