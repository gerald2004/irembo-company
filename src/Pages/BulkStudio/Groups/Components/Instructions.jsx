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
              Group names must be <span className="font-medium">unique</span>.
            </li>
            <li>
              Group leader&lsquo;s client ID must be <span className="font-medium">valid</span> and already registered.
            </li>
            <li>
              Date of registration should be in <span className="font-medium">YYYY-MM-DD</span> format.
            </li>
            <li>
              Location is optional but helps in identification.
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
                <p className="text-sm text-foreground">group_name</p>
                <p className="text-sm text-foreground">leader_client_id</p>
                <p className="text-sm text-foreground">registration_date</p>
                <p className="text-sm text-foreground">location</p>
              </div>
              {/* Type */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <p className="text-sm text-foreground">Text</p>
                <p className="text-sm text-foreground">Number</p>
                <p className="text-sm text-foreground">Date (YYYY-MM-DD)</p>
                <p className="text-sm text-foreground">Text</p>
              </div>
              {/* Description */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm text-foreground">Name of the group</p>
                <p className="text-sm text-foreground">Client ID of the group leader</p>
                <p className="text-sm text-foreground">Date of group registration</p>
                <p className="text-sm text-foreground">Optional location of the group</p>
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
