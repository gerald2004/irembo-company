import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import PayrollSettingsForm from "./Components/PayrollSettings/Forms/PayrollSettingsForm";
import { PayrollSettingsConfig } from "./Components/PayrollSettings/Tables/PayrollSettingsConfig";

const PayrollSettings = () => {
  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Payroll Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payroll Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure payroll accounts, auto-generation, and manage deductions &amp; allowances.
        </p>
      </div>

      <Separator />

      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold">General Settings</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Set the GL accounts used when posting payroll and configure auto-payslip generation.
            </p>
          </div>
          <PayrollSettingsForm />
        </div>

        <div className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">Deductions &amp; Allowances</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Define recurring deductions (e.g. NSSF, tax) and allowances (e.g. housing, transport)
              applied to every payroll run. Assign a GL account to each for granular journal posting.
            </p>
          </div>
          <PayrollSettingsConfig />
        </div>
      </div>
    </div>
  );
};

export default PayrollSettings;
