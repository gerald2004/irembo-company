/* eslint-disable react/prop-types */
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function RecentTransactions({ deposits, withdraws }) {
  // Combine and sort deposits and withdraws by timestamp
  const transactions = [
    ...deposits.map((transaction) => ({
      ...transaction,
      type: "deposit",
    })),
    ...withdraws.map((transaction) => ({
      ...transaction,
      type: "withdraw",
    })),
  ]
    .sort((a, b) => new Date(b?.timestamp) - new Date(a?.timestamp))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {transactions?.map((transaction, index) => (
        <div key={index} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={`/avatars/${(index % 5) + 1}.png`} alt="Avatar" />
            <AvatarFallback>
              {transaction?.client_name?.split(" ")?.map((word) => word[0])?.join("")}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {transaction?.client_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {transaction?.account_number} •{" "}
              {new Date(transaction?.timestamp)?.toLocaleString()}
            </p>
          </div>
          <div className="ml-auto font-medium text-sm">
            {transaction?.type === "deposit" ? "+" : "-"} UGX
            {transaction?.amount?.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
