const Instructions = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Bulk SMS Instructions</h3>
      <div className="space-y-2">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-1">•</div>
          <p className="text-sm">
            Select the recipient type - all members, specific groups, or upload a custom list.
          </p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-1">•</div>
          <p className="text-sm">
            Compose your message or select from available templates.
          </p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-1">•</div>
          <p className="text-sm">
            Use available variables like {'{name}'}, {'{amount}'} to personalize messages.
          </p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-1">•</div>
          <p className="text-sm">
            Each SMS has a limit of 160 characters. Longer messages will be split.
          </p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-1">•</div>
          <p className="text-sm">
            You can schedule messages for later delivery if needed.
          </p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-1">•</div>
          <p className="text-sm text-red-500">
            Note: SMS charges will apply based on the number of recipients.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Instructions;