import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AirtelLogo from "@/Assets/img/airtel.png";
import MtnLogo from "@/Assets/img/mtn.png";

const UtilityFloat = () => {
  const availableFloat = 0.00;
  const transactionsAvailable = 0;

  const unpaidFloat = 0.00;
  const pendingTransactions = 0;

  const CombinedLogo = () => (
    <div className="flex items-center gap-2 w-24 h-24">
      <img
        src={AirtelLogo}
        className="w-1/2 h-full object-contain"
        alt="Airtel"
      />
      <img src={MtnLogo} className="w-1/2 h-full object-contain" alt="MTN" />
    </div>
  );

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      {/* Available Float Card */}
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">
            Available Float
          </CardTitle>
          <CombinedLogo />
        </CardHeader>
        <CardContent className="flex flex-col justify-end flex-grow space-y-2">
          <div className="text-xl font-bold">
            UGX {availableFloat.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">
            {transactionsAvailable} Utility Transactions
          </p>
        </CardContent>
      </Card>

      {/* Unpaid Float Card */}
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">Pending Float</CardTitle>
          <CombinedLogo />
        </CardHeader>
        <CardContent className="flex flex-col justify-end flex-grow space-y-2">
          <div className="text-xl font-bold">
            UGX {unpaidFloat.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">
            {pendingTransactions} Transactions Pending
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UtilityFloat;
