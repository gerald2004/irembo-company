const Instructions = () => (
  <div className="space-y-4">
    <div className="rounded-lg border p-4 space-y-2">
      <h4 className="font-semibold text-sm">Instructions</h4>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
        <li>Phone number must be unique — duplicates will be skipped</li>
        <li>National ID must be unique if provided</li>
        <li>Gender: use &ldquo;Male&rdquo; or &ldquo;Female&rdquo; (or M/F)</li>
        <li>Date of birth format: YYYY-MM-DD</li>
        <li>Email, address, and national_id are optional</li>
        <li>Maximum 500 rows per upload</li>
      </ul>
    </div>
    <div className="rounded-lg border p-4 space-y-2">
      <h4 className="font-semibold text-sm">CSV Format</h4>
      <table className="w-full text-xs">
        <thead><tr className="border-b"><th className="py-1 text-left">Column</th><th className="py-1 text-left">Required</th><th className="py-1 text-left">Example</th></tr></thead>
        <tbody className="text-muted-foreground">
          <tr className="border-b"><td className="py-1">firstname</td><td>Yes</td><td>Jane</td></tr>
          <tr className="border-b"><td className="py-1">lastname</td><td>Yes</td><td>Nakato</td></tr>
          <tr className="border-b"><td className="py-1">gender</td><td>Yes</td><td>Female</td></tr>
          <tr className="border-b"><td className="py-1">date_of_birth</td><td>No</td><td>1990-05-15</td></tr>
          <tr className="border-b"><td className="py-1">phone</td><td>Yes</td><td>0701234567</td></tr>
          <tr className="border-b"><td className="py-1">email</td><td>No</td><td>jane@example.com</td></tr>
          <tr className="border-b"><td className="py-1">address</td><td>No</td><td>Kampala</td></tr>
          <tr><td className="py-1">national_id</td><td>No</td><td>CM900515001234</td></tr>
        </tbody>
      </table>
    </div>
  </div>
);
export default Instructions;
