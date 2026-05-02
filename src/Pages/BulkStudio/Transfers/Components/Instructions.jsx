const Instructions = () => (
  <div className="space-y-4">
    <div className="rounded-lg border p-4 space-y-2">
      <h4 className="font-semibold text-sm">Instructions</h4>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
        <li>Both source and destination accounts must exist in this SACCO</li>
        <li>Source account must have sufficient balance</li>
        <li>Source and destination accounts must be different</li>
        <li>Maximum 1,000 rows per upload</li>
      </ul>
    </div>
    <div className="rounded-lg border p-4 space-y-2">
      <h4 className="font-semibold text-sm">CSV Format</h4>
      <table className="w-full text-xs">
        <thead><tr className="border-b"><th className="py-1 text-left">Column</th><th className="py-1 text-left">Required</th><th className="py-1 text-left">Example</th></tr></thead>
        <tbody className="text-muted-foreground">
          <tr className="border-b"><td className="py-1">from_account</td><td>Yes</td><td>ACC001234</td></tr>
          <tr className="border-b"><td className="py-1">to_account</td><td>Yes</td><td>ACC005678</td></tr>
          <tr className="border-b"><td className="py-1">amount</td><td>Yes</td><td>30000</td></tr>
          <tr><td className="py-1">reference</td><td>No</td><td>TRF-001</td></tr>
        </tbody>
      </table>
    </div>
  </div>
);
export default Instructions;
