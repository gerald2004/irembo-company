import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const CrbFloat = () => {
  const availableCrbFloat = 0.00;
  const reportsAvailable = 0;

  const unpaidCrbFloat = 0.00;
  const pendingReports = 0;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      {/* Available CRB Float Card */}
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">
            Available CRB Float
          </CardTitle>
          
        </CardHeader>
        <CardContent className="flex flex-col justify-end flex-grow space-y-2">
          <div className="text-xl font-bold">
            UGX {availableCrbFloat.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">
            {reportsAvailable} CRB Reports Available
          </p>
        </CardContent>
      </Card>

      {/* Pending CRB Float Card */}
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">
            Pending CRB Float
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-end flex-grow space-y-2">
          <div className="text-xl font-bold">
            UGX {unpaidCrbFloat.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">
            {pendingReports} CRB Reports Pending
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CrbFloat;
