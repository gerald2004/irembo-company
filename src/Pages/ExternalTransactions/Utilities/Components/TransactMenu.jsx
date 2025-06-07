import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Skeleton } from "@/components/ui/skeleton";
// import { useQuery } from "@tanstack/react-query";
// import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
// import { useNavigate } from "react-router-dom";
// ... other imports
import NWSCPaymentDialog from "./Forms/NWSCPaymentDialog";
import BuyLightDialog from "./Forms/BuyLightDialog";
import UraPaymentDialog from "./Forms/UraPaymentDialog";
import PolicePaymentDialog from "./Forms/PolicePaymentDialog";
import StarTimesPaymentDialog from "./Forms/StarTimesPaymentDialog";
import GOtvPaymentDialog from "./Forms/GotvPaymentDialog";
import DstvPaymentDialog from "./Forms/DstvPaymentDialog";
import AirtimeBundleDialog from "./Forms/AirtimeBundleDialog";
import SchoolPaymentDialog from "./Forms/SchoolPaymentDialog";
import SchoolPay from "@/Assets/img/schoolpay.png";
import NWSCLogo from "@/Assets/img/nwsc.png"; // Add these imports for each logo
import UEDCLLogo from "@/Assets/img/uedcl.png";
import URALogo from "@/Assets/img/ura.png";
import PoliceLogo from "@/Assets/img/police.png";
import StartimesLogo from "@/Assets/img/startimes.png";
import GotvLogo from "@/Assets/img/gotv.png";
import DstvLogo from "@/Assets/img/dstv.png";
import MtnLogo from "@/Assets/img/mtn.png";
import AirtelLogo from "@/Assets/img/airtel.png";

const TransactMenu = () => {
  // const navigate = useNavigate();
  // const axiosPrivate = useAxiosPrivate();
  const [isNWSCDialogOpen, setIsNWSCDialogOpen] = useState(false);
  const [isLightDialogOpen, setIsLightDialogOpen] = useState(false);
  const [IsUraPayDialogOpen, setIsUraPayDialogOpen] = useState(false);
  const [IsPolicePayDialogOpen, setIsPolicePayDialogOpen] = useState(false);
  const [IsStarTimesPayDialogOpen, setIsStarTimesPayDialogOpen] =
    useState(false);
  const [IsGotvPayDialogOpen, setIsGotvPayDialogOpen] = useState(false);
  const [IsDstvPayDialogOpen, setIsDstvPayDialogOpen] = useState(false);
  const [IsAirtimeBundleDialogOpen, setIsAirtimeBundleDialogOpen] =
    useState(false);
  const [IsSchoolPayDialogOpen, setIsSchoolPayDialogOpen] = useState(false);

  const handleBuyWater = () => {
    setIsNWSCDialogOpen(true);
  };
  const handleBuyLight = () => {
    setIsLightDialogOpen(true);
  };
  const handlePayURA = () => {
    setIsUraPayDialogOpen(true);
  };
  const handlePayPolice = () => {
    setIsPolicePayDialogOpen(true);
  };
  const handlePayStarTimes = () => {
    setIsStarTimesPayDialogOpen(true);
  };
  const handlePayGotv = () => {
    setIsGotvPayDialogOpen(true);
  };
  const handlePayDstv = () => {
    setIsDstvPayDialogOpen(true);
  };
  const handleBuyAirtimeBundle = () => {
    setIsAirtimeBundleDialogOpen(true);
  };
  const handlePaySchoolFees = () => {
    setIsSchoolPayDialogOpen(true);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* NWSC Card - Example with larger logo */}
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">NWSC</CardTitle>
          <div className="w-16 h-16 flex items-center justify-center">
            <img
              src={NWSCLogo}
              className="w-full h-full object-contain"
              alt="NWSC"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex justify-end items-end">
          <Button size="sm" onClick={() => handleBuyWater("NWSC")}>
            Buy Water
          </Button>
        </CardContent>
      </Card>

      {/* UETCL Card */}
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">UEDCL</CardTitle>
          <div className="w-16 h-16 flex items-center justify-center">
            <img
              src={UEDCLLogo}
              className="w-full h-full object-contain"
              alt="UETCL"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex justify-end items-end">
          <Button size="sm" onClick={() => handleBuyLight("UETCL")}>
            Buy Light
          </Button>
        </CardContent>
      </Card>

      {/* URA Card */}
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">URA</CardTitle>
          <div className="w-16 h-16 flex items-center justify-center">
            <img
              src={URALogo}
              className="w-full h-full object-contain"
              alt="URA"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex justify-end items-end">
          <Button size="sm" onClick={() => handlePayURA("URA")}>
            Pay Taxes
          </Button>
        </CardContent>
      </Card>

      {/* Police Card */}
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Police</CardTitle>
          <div className="w-16 h-16 flex items-center justify-center">
            <img
              src={PoliceLogo}
              className="w-full h-full object-contain"
              alt="Police"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex justify-end items-end">
          <Button
            size="sm"
            onClick={() => handlePayPolice("Police")}
          >
            Pay Fees
          </Button>
        </CardContent>
      </Card>

      {/* Startimes Card */}
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Startimes</CardTitle>
          <div className="w-16 h-16 flex items-center justify-center">
            <img
              src={StartimesLogo}
              className="w-full h-full object-contain"
              alt="Startimes"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex justify-end items-end">
          <Button
            size="sm"
            onClick={() => handlePayStarTimes("Startimes")}
          >
            Subscribe
          </Button>
        </CardContent>
      </Card>
      {/* Gotv Card */}
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Gotv</CardTitle>
          <div className="w-16 h-16 flex items-center justify-center">
            <img
              src={GotvLogo}
              className="w-full h-full object-contain"
              alt="Gotv"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex justify-end items-end">
          <Button
            size="sm"
            onClick={() => handlePayGotv("Gotv")}
          >
            Subscribe
          </Button>
        </CardContent>
      </Card>

      {/* Dstv Card */}
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Dstv</CardTitle>
          <div className="w-16 h-16 flex items-center justify-center">
            <img
              src={DstvLogo}
              className="w-full h-full object-contain"
              alt="Dstv"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex justify-end items-end">
          <Button
            size="sm"
            onClick={() => handlePayDstv("Dstv")}
          >
            Subscribe
          </Button>
        </CardContent>
      </Card>

      {/* Airtime Card */}
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Airtime</CardTitle>
          <div className="w-28 h-20 flex items-center justify-center gap-3">
            <img
              src={MtnLogo} // Replace with your MTN logo path
              className="w-12 h-12 object-contain"
              alt="MTN"
            />
            <img
              src={AirtelLogo} // Replace with your Airtel logo path
              className="w-12 h-12 object-contain"
              alt="Airtel"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex justify-end items-end">
          <Button
            size="sm"
            onClick={() => handleBuyAirtimeBundle("Airtime")}
          >
            Buy Airtime
          </Button>
        </CardContent>
      </Card>

      {/* School Pay Card */}
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">School Pay</CardTitle>
          <div className="w-16 h-16 flex items-center justify-center">
            <img
              src={SchoolPay}
              className="w-full h-full object-contain"
              alt="School Pay"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex justify-end items-end">
          <Button
            size="sm"
            onClick={() => handlePaySchoolFees("School")}
          >
            Pay Fees
          </Button>
        </CardContent>
      </Card>

      <NWSCPaymentDialog
        isOpen={isNWSCDialogOpen}
        onClose={() => setIsNWSCDialogOpen(false)}
        // refetch={yourRefetchFunction}
        // accountId={selectedAccountId}
      />
      <BuyLightDialog
        isOpen={isLightDialogOpen}
        onClose={() => setIsLightDialogOpen(false)}
        // refetch={yourRefetchFunction}
        // accountId={selectedAccountId}
      />
      <UraPaymentDialog
        isOpen={IsUraPayDialogOpen}
        onClose={() => setIsUraPayDialogOpen(false)}
        // refetch={yourRefetchFunction}
        // accountId={selectedAccountId}
      />
      <PolicePaymentDialog
        isOpen={IsPolicePayDialogOpen}
        onClose={() => setIsPolicePayDialogOpen(false)}
        // refetch={yourRefetchFunction}
        // accountId={selectedAccountId}
      />
      <StarTimesPaymentDialog
        isOpen={IsStarTimesPayDialogOpen}
        onClose={() => setIsStarTimesPayDialogOpen(false)}
        // refetch={yourRefetchFunction}
        // accountId={selectedAccountId}
      />
      <GOtvPaymentDialog
        isOpen={IsGotvPayDialogOpen}
        onClose={() => setIsGotvPayDialogOpen(false)}
        // refetch={yourRefetchFunction}
        // accountId={selectedAccountId}
      />
      <DstvPaymentDialog
        isOpen={IsDstvPayDialogOpen}
        onClose={() => setIsDstvPayDialogOpen(false)}
        // refetch={yourRefetchFunction}
        // accountId={selectedAccountId}
      />
      <AirtimeBundleDialog
        isOpen={IsAirtimeBundleDialogOpen}
        onClose={() => setIsAirtimeBundleDialogOpen(false)}
        // refetch={yourRefetchFunction}
        // accountId={selectedAccountId}
      />
      <SchoolPaymentDialog
        isOpen={IsSchoolPayDialogOpen}
        onClose={() => setIsSchoolPayDialogOpen(false)}
        // refetch={yourRefetchFunction}
        // accountId={selectedAccountId}
      />
    </div>
  );
};

export default TransactMenu;
