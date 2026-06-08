import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// In development the SW is disabled (vite.config.js devOptions.enabled=false).
// Unregister any leftover SW from when it was mistakenly enabled in dev,
// so it can no longer intercept Vite's ESM requests and serve HTML instead.
if (import.meta.env.DEV && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((sw) => sw.unregister());
  });
}
import { initDeviceFingerprint } from "@/lib/deviceFingerprint";
initDeviceFingerprint(); // compute + cache in localStorage before first login

import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/MiddleWares/Context/AuthProvider";
import { AdminAuthProvider } from "@/MiddleWares/Context/AdminAuthProvider";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";

const root = ReactDOM.createRoot(document.getElementById("root"));
const queryClient = new QueryClient();
root.render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter
          // future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AuthProvider>
            <AdminAuthProvider>
              <Routes>
                <Route path="/*" element={<App />} />
              </Routes>
            </AdminAuthProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
