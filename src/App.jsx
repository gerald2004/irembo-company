import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import AppRoutes from "./AppRoutes";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

function App() {
  return (
    <>
      <Toaster />
      <PWAInstallPrompt />
      <AppRoutes />
    </>
  );
}

export default App;
