import { useEffect, useState, useMemo } from "react";
import {
  Loader,
  ShieldCheck,
  CheckCircle,
  MonitorSmartphone,
} from "lucide-react";

const LoadingScreen = () => {
  const messages = useMemo(
    () => [
      {
        text: "Checking security...",
        icon: <ShieldCheck className="w-6 h-6 text-gray-500" />,
      },
      {
        text: "Checking device capabilities...",
        icon: <CheckCircle className="w-6 h-6 text-gray-500" />,
      },
      {
        text: "Validating device...",
        icon: <MonitorSmartphone className="w-6 h-6 text-gray-500" />,
      },
    ],
    []
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold text-gray-800">Irembo Finance</h1>
        <p className="text-lg text-gray-600">Loading, please wait...</p>
        <div className="flex items-center justify-center space-x-2">
          {messages[currentIndex].icon}
          <p className="text-gray-500 animate-pulse">
            {messages[currentIndex].text}
          </p>
        </div>
        <Loader className="w-16 h-16 text-gray-600 animate-spin mx-auto mt-6" />
      </div>
    </div>
  );
};

export default LoadingScreen;
