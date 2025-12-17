/* eslint-disable react/prop-types */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const currency = (n) => Number(n || 0).toLocaleString();

const BankCard = ({ bank, onView, onTransfer }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {bank.bank_name}
          <span className="block text-xs text-muted-foreground">
            {bank.account_number}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="text-xl font-bold text-green-700">
          UGX {currency(bank.available)}
        </div>

        <p className="text-xs text-muted-foreground">
          Reserved: UGX {currency(bank.reserved)}
        </p>

        <p className="text-sm text-muted-foreground">
          {bank.transactions} Transactions
        </p>

        <div className="flex gap-2">
          <Button size="sm" onClick={onView}>
            View
          </Button>
          <Button size="sm" variant="outline" onClick={onTransfer}>
            Transfer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const BankFloatCards = ({ branchId }) => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["bank-floats", branchId],
    queryFn: async () => {
      const res = await axiosPrivate.get("/bank-float/accounts", {
        params: { branch_id: branchId },
      });
      return res.data.data.accounts;
    },
  });

  if (isLoading) return <div>Loading bank floats…</div>;
  if (isError) return <div>Error loading bank floats</div>;

  if (!data.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No bank accounts configured.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {data.map((bank) => (
        <BankCard
          key={bank.bank_account_id}
          bank={bank}
          onView={() => navigate(`/bank-float/${bank.bank_account_id}`)}
          onTransfer={() =>
            navigate(`/bank-float/transfer?from=${bank.bank_account_id}`)
          }
        />
      ))}
    </div>
  );
};

export default BankFloatCards;
