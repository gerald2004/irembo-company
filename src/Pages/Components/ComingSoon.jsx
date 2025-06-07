/* eslint-disable react/prop-types */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Rocket, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ComingSoon = ({ fullScreen }) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div
      className={`flex  ${
        fullScreen === "on" ? "h-screen" : ""
      } items-center justify-center`}
    >
      <Card className="max-w-md w-full mx-4 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-3xl font-bold text-center">
            Coming Soon!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="flex justify-center animate-bounce mt-5">
            <div className="relative">
              <Rocket className="h-16 w-16" />
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <p className="font-medium">
              We&lsquo;re working hard to bring you something amazing!
            </p>
          </div>
          <div className="flex justify-center gap-4 pt-2">
            {fullScreen === "on" && (
              <Button
                size="sm"
                onClick={handleGoBack}
                variant="outline"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Go back</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoon;
