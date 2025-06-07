/* eslint-disable react/prop-types */
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  X,
  User,
  CreditCard,
  LockKeyhole,
  FileText,
} from "lucide-react";

const dummyClientAccounts = [
  {
    id: 1,
    account_name: "Primary Savings",
    account_number: "SAV00123456",
    balance: 1500000,
    currency: "UGX",
    account_type: "Savings",
    status: "Active",
  },
  {
    id: 2,
    account_name: "Business Account",
    account_number: "BUS00567890",
    balance: 3500000,
    currency: "UGX",
    account_type: "Current",
    status: "Active",
  },
  {
    id: 3,
    account_name: "Emergency Fund",
    account_number: "SAV00987654",
    balance: 500000,
    currency: "UGX",
    account_type: "Savings",
    status: "Active",
  },
];

const CreditReferenceBureauView = ({ isOpen, onClose, reportTitle }) => {
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [pin, setPin] = useState("");

  const stepIcons = [
    { icon: <User className="w-5 h-5" />, label: "Member" },
    { icon: <CreditCard className="w-5 h-5" />, label: "Account" },
    { icon: <FileText className="w-5 h-5" />, label: "Details" },
    { icon: <LockKeyhole className="w-5 h-5" />, label: "PIN" },
  ];

  const handleSubmit = () => {
    if (!selectedAccount || !selectedMember || pin.length !== 4) {
      toast({
        title: "Error",
        description: "Please fill in all fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsSuccess(true);
    toast({
      title: "Success",
      description: `Viewing report for member ${selectedMember}`,
    });
  };

  const validateStep = () => {
    if (step === 1 && !selectedMember) {
      toast({
        title: "Error",
        description: "Please select a member",
        variant: "destructive",
      });
      return;
    }
    if (step === 2 && !selectedAccount) {
      toast({
        title: "Error",
        description: "Please select an account",
        variant: "destructive",
      });
      return;
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleClose = () => {
    setStep(1);
    setIsSuccess(false);
    setSelectedAccount("");
    setSelectedMember("");
    setPin("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        {isSuccess ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>CRB Report Request Successful!</DialogTitle>
              <DialogDescription>
                Your request to view {reportTitle} has been processed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Member:
                </span>
                <span className="text-sm font-medium">
                  {selectedMember}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Account:
                </span>
                <span className="text-sm font-medium">
                  {
                    dummyClientAccounts.find(
                      (a) => a.id.toString() === selectedAccount
                    )?.account_name
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Report Type:
                </span>
                <span className="text-sm font-medium">
                  {reportTitle}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button sm="sm" onClick={handleClose} className="w-250">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{reportTitle}</DialogTitle>
              <DialogDescription>
                Follow the steps to view the CRB report.
              </DialogDescription>
              <DialogClose asChild>
                <button
                  className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </button>
              </DialogClose>
            </DialogHeader>

            {/* Step Progress Indicator */}
            <div className="flex items-center justify-center space-x-2 my-4">
              {stepIcons.map((stepIcon, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={`rounded-full p-2 ${
                      step > index
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {stepIcon.icon}
                  </div>
                  <span
                    className={`text-xs mt-1 ${
                      step > index ? "font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {stepIcon.label}
                  </span>
                </div>
              ))}
            </div>
            <Progress value={(step / stepIcons.length) * 100} className="my-2" />

            {/* Step 1: Select Member */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Select Member
                  </label>
                  <Select
                    value={selectedMember}
                    onValueChange={setSelectedMember}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member1">Member 1</SelectItem>
                      <SelectItem value="member2">Member 2</SelectItem>
                      <SelectItem value="member3">Member 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 2: Select Account */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Select Account
                  </label>
                  <Select
                    value={selectedAccount}
                    onValueChange={setSelectedAccount}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose account" />
                    </SelectTrigger>
                    <SelectContent>
                      {dummyClientAccounts.map((account) => (
                        <SelectItem
                          key={account.id}
                          value={account.id.toString()}
                        >
                          {account.account_name} - {account.account_number}{" "}
                          (Balance: {account.balance.toLocaleString()} UGX)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 3: Report Details */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-muted/50">
                  <h4 className="font-medium mb-2">Request Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Member:</span>
                    <span>{selectedMember}</span>
                    <span className="text-muted-foreground">Account:</span>
                    <span>
                      {
                        dummyClientAccounts.find(
                          (a) => a.id.toString() === selectedAccount
                        )?.account_name
                      }
                    </span>
                    <span className="text-muted-foreground">Report Type:</span>
                    <span>{reportTitle}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: PIN Entry */}
            {step === 4 && (
              <div className="flex flex-col items-center space-y-4">
                <div className="text-center">
                  <p className="font-medium">Confirm CRB Report Request</p>
                  <p className="text-sm text-muted-foreground">
                    Member: {selectedMember}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Account:{" "}
                    {
                      dummyClientAccounts.find(
                        (a) => a.id.toString() === selectedAccount
                      )?.account_name
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Report: {reportTitle}
                  </p>
                </div>
                <div className="w-full flex flex-col items-center">
                  <Label className="text-center mb-2">
                    Enter PIN to confirm
                  </Label>
                  <InputOTP
                    maxLength={4}
                    onChange={setPin}
                    value={pin}
                    className="justify-center"
                  >
                    <InputOTPGroup className="flex justify-center space-x-2 py-4">
                      {[0, 1, 2, 3].map((index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          className="h-12 w-12 text-center"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            )}

            {/* Footer Navigation */}
            <DialogFooter>
              <div className="flex justify-between w-full">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                )}
                {step < stepIcons.length ? (
                  <Button
                    type="button"
                    onClick={validateStep}
                    className="ml-auto"
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    className="ml-auto"
                  >
                    Confirm Request <CheckCircle className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreditReferenceBureauView;