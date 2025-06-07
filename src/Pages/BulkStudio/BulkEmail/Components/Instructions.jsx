const Instructions = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Bulk Email Instructions</h3>
      <div className="space-y-2">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-1">•</div>
          <p className="text-sm">
            <span className="font-medium">Recipients:</span> Select between all
            members, specific groups, or upload a custom list.
          </p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-1">•</div>
          <p className="text-sm">
            <span className="font-medium">Templates:</span> Use pre-designed
            templates or create your own email content.
          </p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-1">•</div>
          <p className="text-sm">
            <span className="font-medium">Personalization:</span> Use variables
            like {"{name}"}, {"{memberNumber}"} to customize emails.
          </p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-1">•</div>
          <p className="text-sm">
            <span className="font-medium">Attachments:</span> You can attach
            documents (PDF, Word, Excel) up to 5MB each.
          </p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-1">•</div>
          <p className="text-sm">
            <span className="font-medium">Scheduling:</span> Send immediately or
            schedule for a later date/time.
          </p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-1">•</div>
          <p className="text-sm text-red-500">
            <span className="font-medium">Note:</span> Avoid using all caps or
            excessive punctuation to prevent spam filters.
          </p>
        </div>
      </div>

      <div className="pt-4">
        <h4 className="font-medium text-sm mb-2">CSV Format Example:</h4>
        <div className="bg-muted/50 p-3 rounded-md text-xs font-mono border">
          <p className="text-foreground">email,name,member_number</p>
          <p className="text-muted-foreground">
            member1@example.com,John Doe,M001
          </p>
          <p className="text-muted-foreground">
            member2@example.com,Jane Smith,M002
          </p>
          <p className="text-muted-foreground">
            member3@example.com,Robert Johnson,M003
          </p>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
