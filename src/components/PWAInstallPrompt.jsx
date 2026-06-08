import { Download, X } from "lucide-react";
import { useState } from "react";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "pwa_install_dismissed";

export function PWAInstallPrompt() {
  const { canInstall, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === "1"
  );

  if (!canInstall || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border bg-background shadow-lg px-4 py-3 text-sm w-[calc(100%-2rem)] max-w-sm">
      <Download className="h-5 w-5 shrink-0 text-primary" />
      <span className="flex-1 font-medium">Install iRembo Finance Management System</span>
      <Button size="sm" onClick={install} className="shrink-0">
        Install
      </Button>
      <button
        onClick={handleDismiss}
        className="shrink-0 rounded-sm opacity-70 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
