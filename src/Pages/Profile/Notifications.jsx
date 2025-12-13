import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const PAGE_SIZE = 5;

/* ===============================
 | Severity styles
 =============================== */
const levelStyles = {
  critical: {
    badge: "bg-red-700 text-white",
    border: "border-l-red-700",
    title: "text-red-700",
  },
  error: {
    badge: "bg-red-500 text-white",
    border: "border-l-red-500",
    title: "text-red-600",
  },
  warning: {
    badge: "bg-orange-500 text-white",
    border: "border-l-orange-500",
    title: "text-orange-600",
  },
  success: {
    badge: "bg-green-500 text-white",
    border: "border-l-green-500",
    title: "text-green-600",
  },
  info: {
    badge: "bg-blue-500 text-white",
    border: "border-l-blue-500",
    title: "text-blue-600",
  },
};

export default function Notifications() {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [levelFilter, setLevelFilter] = useState("all");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [busyAction, setBusyAction] = useState(false);

  /* ===============================
   | Fetch notifications
   =============================== */
  const { data, isFetching, refetch, isError, error } = useQuery({
    queryKey: ["notifications", page, levelFilter],
    queryFn: async () => {
      const levelParam = levelFilter !== "all" ? `&level=${levelFilter}` : "";
      const res = await axiosPrivate.get(
        `/notifications/system?status=all&page=${page}&limit=${PAGE_SIZE}${levelParam}`
      );

      return (
        res?.data?.data ?? {
          notifications: [],
          total: 0,
          page: 1,
          limit: PAGE_SIZE,
          unread_count: 0,
        }
      );
    },
    keepPreviousData: true,
  });

  const notifications = data?.notifications ?? [];
  const total = Number(data?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Keep page in range if filter reduces results
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  /* ===============================
   | Helpers
   =============================== */
  const routeByEntity = (n) => {
    switch (n?.entity_type) {
      case "loan":
        return `/individual-loans/${n.entity_id}`;
      case "transaction":
        return `/transactions/${n.entity_id}`;
      case "day_closing":
        return `/day-closing/${n.entity_id}`;
      default:
        return null;
    }
  };

  const styleFor = (level) => levelStyles[level] || levelStyles.info;

  /* ===============================
   | Actions
   =============================== */
  const markRead = async (id) => {
    await axiosPrivate.post("/notifications/system", {
      action: "read_one",
      id: Number(id),
    });
  };

  const archive = async (id) => {
    await axiosPrivate.post("/notifications/system", {
      action: "archive",
      id: Number(id),
    });
  };

  const viewNotification = async (n) => {
    if (!n) return;

    setSelectedNotification(n);

    // mark as read on open
    if (!n.is_read) {
      try {
        setBusyAction(true);
        await markRead(n.id);
        await refetch();
      } catch (e) {
        console.error("Failed to mark read", e);
      } finally {
        setBusyAction(false);
      }
    }
  };

  const archiveNotification = async (id) => {
    try {
      setBusyAction(true);
      await archive(id);
      setSelectedNotification(null);
      await refetch();
    } catch (e) {
      console.error("Failed to archive", e);
    } finally {
      setBusyAction(false);
    }
  };

  /* ===============================
   | Auto-open CRITICAL / ERROR
   | (only if no modal is open)
   =============================== */
  useEffect(() => {
    if (selectedNotification) return;
    if (!notifications.length) return;

    const urgent = notifications.find(
      (n) => !n.is_read && ["critical", "error"].includes(n.level)
    );

    if (urgent) viewNotification(urgent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  /* ===============================
   | Sound alert for CRITICAL unread
   | (plays once per page render set)
   =============================== */
  const hasCriticalUnread = useMemo(
    () => notifications.some((n) => !n.is_read && n.level === "critical"),
    [notifications]
  );

  useEffect(() => {
    if (!hasCriticalUnread) return;
    const audio = new Audio("/sounds/alert.mp3");
    audio.play().catch(() => {});
  }, [hasCriticalUnread]);

  return (
    <>
      {/* ================= Breadcrumb ================= */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Notifications</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex mt-2">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between gap-3">
            <h5 className="text-2xl font-bold">Notifications</h5>

            {/* Optional: quick refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              Refresh
            </Button>
          </div>

          {/* ================= Filters ================= */}
          <div className="flex gap-2 flex-wrap">
            {["all", "info", "success", "warning", "error", "critical"].map(
              (l) => (
                <Button
                  key={l}
                  size="sm"
                  variant={levelFilter === l ? "default" : "outline"}
                  onClick={() => {
                    setPage(1);
                    setLevelFilter(l);
                  }}
                  disabled={isFetching}
                >
                  {l.toUpperCase()}
                </Button>
              )
            )}
          </div>

          {/* ================= Error ================= */}
          {isError && (
            <div className="p-3 rounded-md border text-sm text-red-600">
              Failed to load notifications.{" "}
              <span className="text-muted-foreground">
                {String(error?.message || "")}
              </span>
            </div>
          )}

          {/* ================= Loading ================= */}
          {isFetching && (
            <div className="text-sm text-muted-foreground">
              Loading notifications…
            </div>
          )}

          {/* ================= Empty ================= */}
          {!isFetching && !isError && notifications.length === 0 && (
            <div className="text-center text-muted-foreground">
              No notifications available
            </div>
          )}

          {/* ================= List ================= */}
          {!isFetching &&
            !isError &&
            notifications.map((n) => {
              const s = styleFor(n.level);
              return (
                <Card
                  key={n.id}
                  className={`cursor-pointer border-l-4 ${s.border} ${
                    !n.is_read ? "bg-muted/40" : "bg-background"
                  } hover:shadow-md transition`}
                  onClick={() => viewNotification(n)}
                >
                  <div className="px-6 pt-4">
                    <CardTitle className="flex justify-between items-center gap-3">
                      <span
                        className={`${
                          !n.is_read ? "font-extrabold" : "font-semibold"
                        } ${s.title}`}
                      >
                        {n.title}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.badge}`}
                      >
                        {(n.level || "info").toUpperCase()}
                      </span>
                    </CardTitle>
                  </div>

                  <CardContent className="flex justify-between gap-4 pt-2 pb-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {n.message}
                    </p>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </CardContent>
                </Card>
              );
            })}

          {/* ================= Pagination ================= */}
          {!isError && totalPages > 1 && (
            <div className="flex justify-center gap-4 mt-4">
              <Button
                variant="outline"
                disabled={page === 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>

              <span className="text-sm self-center">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                disabled={page === totalPages || isFetching}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ================= Modal ================= */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div
            className={`bg-background w-full max-w-lg rounded-xl shadow-2xl p-6 border-l-8 ${
              styleFor(selectedNotification.level).border
            }`}
          >
            <h3
              className={`text-lg font-extrabold mb-2 ${
                styleFor(selectedNotification.level).title
              }`}
            >
              {selectedNotification.title}
            </h3>

            {["critical", "error"].includes(selectedNotification.level) && (
              <div className="mb-3 p-2 rounded bg-red-100 text-red-800 text-sm font-semibold">
                ⚠ Immediate attention required
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {selectedNotification.message}
            </p>

            <Separator />

            <div className="flex justify-between items-center mt-4 gap-3">
              <span className="text-xs text-muted-foreground">
                {new Date(selectedNotification.created_at).toLocaleString()}
              </span>

              <div className="flex gap-2">
                {routeByEntity(selectedNotification) && (
                  <Button
                    onClick={() =>
                      navigate(routeByEntity(selectedNotification))
                    }
                    disabled={busyAction}
                  >
                    Go to record
                  </Button>
                )}

                <Button
                  variant="destructive"
                  onClick={() => archiveNotification(selectedNotification.id)}
                  disabled={busyAction}
                >
                  {busyAction ? "..." : "Archive"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setSelectedNotification(null)}
                  disabled={busyAction}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
