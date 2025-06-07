import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Instructions = () => {
  return (
    <div className="mt-6 space-y-6">
      {/* Card for General Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-sm space-y-1 text-foreground">
            <li>
              Only <span className="font-medium">valid</span> client IDs and account IDs will be processed.
            </li>
            <li>
              Ensure transfer amount is a <span className="font-medium">positive number</span>.
            </li>
            <li>
              Date must be in <span className="font-medium">YYYY-MM-DD</span> format.
            </li>
            <li>
              Transfers between the same account are <span className="font-medium">not allowed</span>.
            </li>
            <li>
              Reference is optional but recommended for tracking.
            </li>
            <li>
              CSV file should not exceed <span className="font-medium">1000 rows</span>.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Card for CSV Format */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">CSV Format Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Column */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Column</p>
                <p className="text-sm text-foreground">client_id</p>
                <p className="text-sm text-foreground">from_account_id</p>
                <p className="text-sm text-foreground">to_account_id</p>
                <p className="text-sm text-foreground">amount</p>
                <p className="text-sm text-foreground">transaction_date</p>
                <p className="text-sm text-foreground">reference</p>
              </div>
              {/* Type */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <p className="text-sm text-foreground">Number</p>
                <p className="text-sm text-foreground">Number</p>
                <p className="text-sm text-foreground">Number</p>
                <p className="text-sm text-foreground">Number</p>
                <p className="text-sm text-foreground">Date (YYYY-MM-DD)</p>
                <p className="text-sm text-foreground">Text</p>
              </div>
              {/* Description */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm text-foreground">Client initiating the transfer</p>
                <p className="text-sm text-foreground">Source account ID</p>
                <p className="text-sm text-foreground">Destination account ID</p>
                <p className="text-sm text-foreground">Amount to transfer</p>
                <p className="text-sm text-foreground">Date of transaction</p>
                <p className="text-sm text-foreground">Optional transaction reference</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">
                Note: First row must contain headers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Instructions;
