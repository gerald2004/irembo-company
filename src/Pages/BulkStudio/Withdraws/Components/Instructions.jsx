const Instructions = () => (
  <div className="space-y-4">
    <div className="rounded-lg border p-4 space-y-2">
      <h4 className="font-semibold text-sm">Instructions</h4>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
        <li>Upload a CSV file with the columns below — header row required</li>
        <li>Account must have sufficient balance to cover the withdrawal amount</li>
        <li>Minimum balance rules apply per account product</li>
        <li>Withdrawal fees are not auto-applied in bulk mode</li>
        <li>Maximum 1,000 rows per upload</li>
      </ul>
    </div>
    <div className="rounded-lg border p-4 space-y-2">
      <h4 className="font-semibold text-sm">CSV Format</h4>
      <table className="w-full text-xs">
        <thead><tr className="border-b"><th className="py-1 text-left">Column</th><th className="py-1 text-left">Required</th><th className="py-1 text-left">Example</th></tr></thead>
        <tbody className="text-muted-foreground">
          <tr className="border-b"><td className="py-1">account_number</td><td>Yes</td><td>ACC001234</td></tr>
          <tr className="border-b"><td className="py-1">amount</td><td>Yes</td><td>20000</td></tr>
          <tr><td className="py-1">reference</td><td>No</td><td>WTHDRW-001</td></tr>
        </tbody>
      </table>
    </div>
  </div>
);
export default Instructions;
