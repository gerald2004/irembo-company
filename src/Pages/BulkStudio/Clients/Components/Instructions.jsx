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
              Ensure all required fields are <span className="font-medium">accurate</span> and not empty.
            </li>
            <li>
              Email addresses (if provided) must be in <span className="font-medium">valid format</span>.
            </li>
            <li>
              Phone numbers should follow the correct <span className="font-medium">international format</span> (e.g., +256...).
            </li>
            <li>
              Gender should be specified as <span className="font-medium">Male</span> or <span className="font-medium">Female</span>.
            </li>
            <li>
              Date of birth should be in <span className="font-medium">YYYY-MM-DD</span> format.
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
                <p className="text-sm text-foreground">first_name</p>
                <p className="text-sm text-foreground">last_name</p>
                <p className="text-sm text-foreground">gender</p>
                <p className="text-sm text-foreground">date_of_birth</p>
                <p className="text-sm text-foreground">phone_number</p>
                <p className="text-sm text-foreground">email</p>
                <p className="text-sm text-foreground">address</p>
              </div>
              {/* Type */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <p className="text-sm text-foreground">Text</p>
                <p className="text-sm text-foreground">Text</p>
                <p className="text-sm text-foreground">Text</p>
                <p className="text-sm text-foreground">Date (YYYY-MM-DD)</p>
                <p className="text-sm text-foreground">Text</p>
                <p className="text-sm text-foreground">Text (Optional)</p>
                <p className="text-sm text-foreground">Text (Optional)</p>
              </div>
              {/* Description */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm text-foreground">Client&lsquo;s first name</p>
                <p className="text-sm text-foreground">Client&lsquo;s last name</p>
                <p className="text-sm text-foreground">Gender (Male/Female)</p>
                <p className="text-sm text-foreground">Birth date of the client</p>
                <p className="text-sm text-foreground">Contact phone number</p>
                <p className="text-sm text-foreground">Email address (optional)</p>
                <p className="text-sm text-foreground">Residential address (optional)</p>
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
