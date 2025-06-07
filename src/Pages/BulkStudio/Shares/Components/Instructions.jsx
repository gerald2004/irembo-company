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
              Only <span className="font-medium">valid</span> client IDs will be processed.
            </li>
            <li>
              Ensure dates are in <span className="font-medium">YYYY-MM-DD</span> format.
            </li>
            <li>
              Number of shares must be a <span className="font-medium">positive whole number</span>.
            </li>
            <li>
              Share price should be a valid <span className="font-medium">numeric value</span> (if provided).
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
                <p className="text-sm text-foreground">number_of_shares</p>
                <p className="text-sm text-foreground">transaction_date</p>
                <p className="text-sm text-foreground">share_price</p>
                <p className="text-sm text-foreground">reference</p>
              </div>
              {/* Type */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <p className="text-sm text-foreground">Number</p>
                <p className="text-sm text-foreground">Number</p>
                <p className="text-sm text-foreground">Date (YYYY-MM-DD)</p>
                <p className="text-sm text-foreground">Number (Optional)</p>
                <p className="text-sm text-foreground">Text</p>
              </div>
              {/* Description */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm text-foreground">Unique member ID</p>
                <p className="text-sm text-foreground">Shares being purchased or allotted</p>
                <p className="text-sm text-foreground">Date of share transaction</p>
                <p className="text-sm text-foreground">Price per share (if applicable)</p>
                <p className="text-sm text-foreground">Optional tracking reference</p>
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
