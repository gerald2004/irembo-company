import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MtnLogo from "@/Assets/img/mtn.png";
import AirtelLogo from "@/Assets/img/airtel.png";

const MobileMoney = () => {
  const handleDisburse = () => {
    // Placeholder logic
  };

  const handleCollect = () => {
    // Placeholder logic
  };

  const airtelDisbursementAmount = 0.00;
  const mtnDisbursementAmount = 0.00;
  const airtelCollectAmount = 0.00;
  const mtnCollectAmount = 0.00;

  const airtelDisburseCount = 0;
  const mtnDisburseCount = 0;
  const airtelCollectCount = 0;
  const mtnCollectCount = 0;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      {/* Airtel Disbursement */}
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">
            Airtel Disbursement Account
          </CardTitle>
          <div className="w-16 h-16 flex items-center justify-center">
            <img
              src={AirtelLogo}
              className="w-full h-full object-contain"
              alt="Airtel"
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col justify-end flex-grow space-y-2">
          <div className="text-xl font-bold">
            UGX {airtelDisbursementAmount.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">
            {airtelDisburseCount} Transactions
          </p>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => handleDisburse("Airtel")}>
              View
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* MTN Disbursement */}
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">
            MTN Disbursement Account
          </CardTitle>
          <div className="w-16 h-16 flex items-center justify-center">
            <img
              src={MtnLogo}
              className="w-full h-full object-contain"
              alt="MTN"
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col justify-end flex-grow space-y-2">
          <div className="text-xl font-bold">
            UGX {mtnDisbursementAmount.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">
            {mtnDisburseCount} Transactions
          </p>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => handleDisburse("MTN")}>
              View
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Airtel Collect */}
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">
            Airtel Collect Account
          </CardTitle>
          <div className="w-16 h-16 flex items-center justify-center">
            <img
              src={AirtelLogo}
              className="w-full h-full object-contain"
              alt="Airtel"
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col justify-end flex-grow space-y-2">
          <div className="text-xl font-bold">
            UGX {airtelCollectAmount.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">
            {airtelCollectCount} Transactions
          </p>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => handleCollect("Airtel")}>
              View
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* MTN Collect */}
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">
            MTN Collect Account
          </CardTitle>
          <div className="w-16 h-16 flex items-center justify-center">
            <img
              src={MtnLogo}
              className="w-full h-full object-contain"
              alt="MTN"
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col justify-end flex-grow space-y-2">
          <div className="text-xl font-bold">
            UGX {mtnCollectAmount.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">
            {mtnCollectCount} Transactions
          </p>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => handleCollect("MTN")}>
              View
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileMoney;
