import { useQuery } from "@tanstack/react-query";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { HardDrive, FolderOpen, FileImage, User, Building2, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

// ── constants ─────────────────────────────────────────────────────────────────
const CATEGORY_STYLE = {
  blue:   { icon: FileImage,  text: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-100 dark:bg-blue-900/30",    bar: "bg-blue-500" },
  violet: { icon: User,       text: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/30", bar: "bg-violet-500" },
  amber:  { icon: Building2,  text: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-100 dark:bg-amber-900/30",   bar: "bg-amber-500" },
};

// ── helpers ───────────────────────────────────────────────────────────────────
function quotaColor(pct) {
  if (pct >= 90) return { text: "text-red-600 dark:text-red-400",    bar: "bg-red-500" };
  if (pct >= 70) return { text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" };
  return           { text: "text-green-600 dark:text-green-400",      bar: "bg-green-500" };
}

// ── quota gauge — the big card at top ────────────────────────────────────────
function QuotaGauge({ data }) {
  const pct    = data.used_percent;
  const colors = quotaColor(pct);
  const free   = 100 - pct;

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Storage Quota</CardTitle>
              <CardDescription>2.0 GB allocated per SACCO</CardDescription>
            </div>
          </div>
          <span className={`text-3xl font-bold tabular-nums ${colors.text}`}>
            {pct}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{data.used_size} used</span>
            <span>{data.free_size} free of {data.quota_size}</span>
          </div>
        </div>

        {/* Three summary numbers */}
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="text-center pr-4">
            <p className="text-xs text-muted-foreground mb-0.5">Used</p>
            <p className={`text-xl font-bold tabular-nums ${colors.text}`}>{data.used_size}</p>
            <p className="text-xs text-muted-foreground">{pct}% of quota</p>
          </div>
          <div className="text-center px-4">
            <p className="text-xs text-muted-foreground mb-0.5">Free</p>
            <p className="text-xl font-bold tabular-nums text-green-600 dark:text-green-400">{data.free_size}</p>
            <p className="text-xs text-muted-foreground">{free.toFixed(2)}% remaining</p>
          </div>
          <div className="text-center pl-4">
            <p className="text-xs text-muted-foreground mb-0.5">Files</p>
            <p className="text-xl font-bold tabular-nums">{data.total_files.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">total stored</p>
          </div>
        </div>

        {/* Status badge */}
        {pct >= 90 ? (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Storage is critically full. Clean up old files or contact support to increase your quota.
          </div>
        ) : pct >= 70 ? (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Storage is running low. Consider removing unused files.
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2 text-sm text-green-700 dark:text-green-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Storage is healthy.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── category card — % of quota ────────────────────────────────────────────────
function CategoryCard({ category }) {
  const style  = CATEGORY_STYLE[category.color] ?? CATEGORY_STYLE.blue;
  const Icon   = style.icon;
  const pct    = category.quota_percent;

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-2 rounded-lg shrink-0 ${style.bg}`}>
              <Icon className={`h-4 w-4 ${style.text}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{category.name}</p>
              <p className="text-xs text-muted-foreground truncate">{category.description}</p>
            </div>
          </div>
          <span className={`text-xl font-bold tabular-nums shrink-0 ${style.text}`}>
            {pct}%
          </span>
        </div>

        {/* Progress bar (% of 2 GB quota) */}
        <div className="space-y-1">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{category.size}</span>
            <span>{category.files} file{category.files !== 1 ? "s" : ""} · {pct}% of 2 GB</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function SaccoDiskUsage() {
  const axiosPrivate = useAxiosPrivate();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["sacco_disk_usage"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/settings/system/disk-usage");
      return res?.data?.data?.disk_usage ?? null;
    },
    refetchInterval: 60_000,
    staleTime:       30_000,
  });

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/general-config">System Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Disk Usage</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-6 pt-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h5 className="text-2xl font-bold tracking-tight">Storage & Disk Usage</h5>
            <p className="text-sm text-muted-foreground mt-1">
              Each SACCO gets a <strong>2 GB</strong> storage quota.
              {data?.scanned_at && (
                <span className="ml-2 opacity-60 text-xs">Scanned at {data.scanned_at}</span>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Refreshing…" : "Refresh"}
          </Button>
        </div>

        {/* Error */}
        {isError && (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-4 flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">
                {error?.response?.data?.messages?.[0] ?? "Failed to load disk usage. Please try again."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-52 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {!isLoading && data && (
          <>
            {/* Quota gauge */}
            <QuotaGauge data={data} />

            {/* Per-category breakdown */}
            <div>
              <h6 className="text-base font-semibold mb-3">Breakdown by Category</h6>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.breakdown.map((cat) => (
                  <CategoryCard key={cat.name} category={cat} />
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </>
  );
}
