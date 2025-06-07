import { useState } from "react";
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

const Notifications = () => {
  const notifications = [];

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;
  const totalPages = Math.ceil(notifications.length / pageSize);

  const startIndex = (currentPage - 1) * pageSize;
  const currentNotifications = notifications.slice(
    startIndex,
    startIndex + pageSize
  );

  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <>
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
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold">Notifications</h5>
          </div>
          {currentNotifications.length > 1 && (
            <div>
              {currentNotifications.map((message, index) => (
                <div key={index} className="mb-4">
                  <Card>
                    <div className="p-y-6 px-6 mt-4">
                      <CardTitle>Notification Title</CardTitle>
                    </div>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <p className="text-sm">{message}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                          <Button size="sm" variant="destructive">
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}

              <div className="flex justify-center mt-4 gap-4">
                <Button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-sm self-center">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          {currentNotifications.length <= 0 && (
            <div className="text-center"> No Notifications Available</div>
          )}
        </div>
      </div>
    </>
  );
};

export default Notifications;
