import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

const placeholders = [
  {
    key: "{accountNumber}",
    description: "The member's unique account number in the SACCO.",
  },
  {
    key: "{loanBalance}",
    description: "The remaining balance on an active loan.",
  },
  {
    key: "{accountBalance}",
    description: "The current balance in a member's savings or shares account.",
  },
  {
    key: "{firstName}",
    description: "The first name of the member receiving the notification.",
  },
  {
    key: "{lastName}",
    description: "The last name of the member receiving the notification.",
  },
  {
    key: "{shareBalance}",
    description: "The total shareholding balance of the member.",
  },
  {
    key: "{timeStamp}",
    description: "The exact date and time of the transaction or event.",
  },
  {
    key: "{loanNumber}",
    description: "The unique loan reference number assigned to a loan.",
  },
  {
    key: "{loanAmount}",
    description: "The original amount borrowed for a loan.",
  },
  {
    key: "{saccoName}",
    description: "The full name of the SACCO (e.g., 'Irembo SACCO').",
  },
  {
    key: "{saccoShortName}",
    description: "The short or acronym name of the SACCO (e.g., 'IREMBO').",
  },
  {
    key: "{amountPaid}",
    description: "The amount paid towards a loan or savings.",
  },
  {
    key: "{date}",
    description: "The specific date when a transaction or event occurred.",
  },
  {
    key: "{transactionId}",
    description:
      "The transaction Id that identifies it uniquely in the system.",
  },
  {
    key: "{savingProduct}",
    description:
      "The saving account product or current account product.",
  },
];

const NotificationLegend = () => {
  const [copied, setCopied] = useState(null);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <Card className="w-full mx-auto shadow-md">
      <CardHeader>
        <CardTitle>📌 Notification Message Placeholders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
        {placeholders.map((placeholder) => (
          <div
            key={placeholder.key}
            className="flex items-center justify-between p-2 border rounded-lg shadow-sm"
          >
            <div>
              <p className="font-semibold text-sm">{placeholder.key}</p>
              <p className="text-xs">{placeholder.description}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy(placeholder.key)}
            >
              {copied === placeholder.key ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default NotificationLegend;
