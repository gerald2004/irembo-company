import { Download, X } from "lucide-react";
import { useState } from "react";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";

export function PWAInstallPrompt() {
  const { canInstall, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border bg-background shadow-lg px-4 py-3 text-sm w-[calc(100%-2rem)] max-w-sm">
      <Download className="h-5 w-5 shrink-0 text-primary" />
      <span className="flex-1 font-medium">Install Irembo for faster access</span>
      <Button size="sm" onClick={install} className="shrink-0">
        Install
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-sm opacity-70 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
