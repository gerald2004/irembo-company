/* eslint-disable react/prop-types */
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const BranchSummary = ({ isLoading, isError, branch, error }) => {
  if (isLoading) {
    return (
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="bg-gray-100 p-4">
            <Skeleton className="h-6 w-1/2 mb-4 rounded" />
            <Skeleton className="h-4 w-1/3 rounded" />
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} className="h-4 w-3/4 rounded" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-500 text-center font-bold">
        Error: {error?.message || "Failed to load branch details"}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center p-4">
      <div className="max-w-lg w-full">
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="p-4 rounded-t-xl">
            <CardTitle className="text-xl font-semibold">
              {branch?.name || "N/A"}
            </CardTitle>
            <div className="border-b" />
            <CardDescription className="text-sm">
              {`Branch Code: ${branch?.code || "N/A"}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-sm">
            <p className="flex items-center">
              <span className="w-1/3 font-medium">Contact:</span>
              <span>{branch?.contact || "N/A"}</span>
            </p>
            <p className="flex items-center">
              <span className="w-1/3 font-medium">Email:</span>
              <span>{branch?.email || "N/A"}</span>
            </p>
            <p className="flex items-center">
              <span className="w-1/3 font-medium">Address:</span>
              <span>{branch?.address || "N/A"}</span>
            </p>
            <p className="flex items-center">
              <span className="w-1/3 font-medium">Description:</span>
              <span>{branch?.description || "N/A"}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BranchSummary;
