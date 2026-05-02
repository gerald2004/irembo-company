const Instructions = () => (
  <div className="space-y-4">
    <div className="rounded-lg border p-4 space-y-2">
      <h4 className="font-semibold text-sm">Instructions</h4>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
        <li>Group name must be unique within this SACCO</li>
        <li>Phone number must be unique — used as the group&apos;s contact</li>
        <li>Email and address are optional</li>
        <li>Groups are registered with status &ldquo;active&rdquo;</li>
        <li>Maximum 200 rows per upload</li>
      </ul>
    </div>
    <div className="rounded-lg border p-4 space-y-2">
      <h4 className="font-semibold text-sm">CSV Format</h4>
      <table className="w-full text-xs">
        <thead><tr className="border-b"><th className="py-1 text-left">Column</th><th className="py-1 text-left">Required</th><th className="py-1 text-left">Example</th></tr></thead>
        <tbody className="text-muted-foreground">
          <tr className="border-b"><td className="py-1">group_name</td><td>Yes</td><td>Kampala Women Savers</td></tr>
          <tr className="border-b"><td className="py-1">phone</td><td>Yes</td><td>0701234567</td></tr>
          <tr className="border-b"><td className="py-1">email</td><td>No</td><td>kws@mail.com</td></tr>
          <tr><td className="py-1">address</td><td>No</td><td>Kampala Central</td></tr>
        </tbody>
      </table>
    </div>
  </div>
);
export default Instructions;
