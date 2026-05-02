const Instructions = () => (
  <div className="space-y-4">
    <div className="rounded-lg border p-4 space-y-2">
      <h4 className="font-semibold text-sm">Instructions</h4>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
        <li>Use the client&apos;s registered phone number to identify them</li>
        <li>loan_product_id must be a valid loan product ID in this SACCO</li>
        <li>Applications are created with status &ldquo;pending&rdquo; — review before disbursing</li>
        <li>Tenure is in months. Amount must be at least 1,000</li>
        <li>Maximum 500 rows per upload</li>
      </ul>
    </div>
    <div className="rounded-lg border p-4 space-y-2">
      <h4 className="font-semibold text-sm">CSV Format</h4>
      <table className="w-full text-xs">
        <thead><tr className="border-b"><th className="py-1 text-left">Column</th><th className="py-1 text-left">Required</th><th className="py-1 text-left">Example</th></tr></thead>
        <tbody className="text-muted-foreground">
          <tr className="border-b"><td className="py-1">client_phone</td><td>Yes</td><td>0701234567</td></tr>
          <tr className="border-b"><td className="py-1">loan_product_id</td><td>Yes</td><td>1</td></tr>
          <tr className="border-b"><td className="py-1">amount</td><td>Yes</td><td>2000000</td></tr>
          <tr className="border-b"><td className="py-1">tenure_months</td><td>Yes</td><td>12</td></tr>
          <tr><td className="py-1">purpose</td><td>No</td><td>Business expansion</td></tr>
        </tbody>
      </table>
    </div>
  </div>
);
export default Instructions;
