import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BadgeX } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Missing = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-4xl font-bold text-center text-gray-900 dark:text-white">
            404
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-1">
          <div className="flex justify-center">
            <BadgeX className="h-20 w-20 text-red-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Oops! The page you are looking for does not exist or has been moved
            to another URL.
          </p>
          <div className="flex justify-center">
            <Button
              onClick={handleGoBack}
              className="mt-4 flex items-center space-x-0 px-4 py-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go back</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Missing;
