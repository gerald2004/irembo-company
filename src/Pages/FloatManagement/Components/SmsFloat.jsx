import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Mail, MailMinus } from "lucide-react";

const SmsFloat = () => {
  const smsBalance = 0.00;
  const smsMessageCount = 0;

  const unpaidSmsBalance = 0.00;
  const unpaidMessageCount = 0;


  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      {/* SMS Balance Card */}
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">SMS Balance</CardTitle>
          <Mail />
        </CardHeader>
        <CardContent className="flex flex-col justify-end flex-grow space-y-2">
          <div className="text-xl font-bold">UGX {smsBalance.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">{smsMessageCount} Messages Available</p>
        </CardContent>
      </Card>

      {/* Unpaid SMS Balance Card */}
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">Unpaid SMS Balance</CardTitle>
          <MailMinus />
        </CardHeader>
        <CardContent className="flex flex-col justify-end flex-grow space-y-2">
          <div className="text-xl font-bold">UGX {unpaidSmsBalance.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">{unpaidMessageCount} Messages Unpaid</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmsFloat;
