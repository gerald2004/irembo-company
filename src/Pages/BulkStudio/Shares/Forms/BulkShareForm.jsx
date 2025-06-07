import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Download } from "lucide-react";

const BulkShareForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    
  } = useForm({
    defaultValues: {
      withdrawFile: null,
      account: "",
      pin: "",
    },
    mode: "onChange",
  });

  const [fileName, setFileName] = useState("");
  const [filePreview, setFilePreview] = useState([]);
  const [showPin, setShowPin] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        const lines = content.split("\n").slice(0, 5);
        setFilePreview(lines);
      };
      reader.readAsText(file);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent =
      "client_id,amount,transaction_date,reference\n12345,5000,2023-05-15,WDR001\n67890,3000,2023-05-15,WDR002";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bulk_withdraw_sample.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onSubmit = (data) => {
    toast({
      title: "Bulk withdrawal initiated",
      description: `Processing ${fileName} from account ${data.account}`,
    });
  };



  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="withdrawFile">Upload CSV File</Label>
        <div className="flex items-center gap-4">
          <input
            id="withdrawFile"
            type="file"
            accept=".csv"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("withdrawFile", {
              required: "CSV file is required",
              validate: {
                fileType: (files) =>
                  files?.[0]?.name?.endsWith(".csv") ||
                  "Only CSV files are allowed",
                fileSize: (files) =>
                  files?.[0]?.size <= 5 * 1024 * 1024 ||
                  "File size must be less than 5MB",
              },
              onChange: handleFileChange,
            })}
          />
          <Button
            size="sm"
            type="button"
            onClick={downloadSampleCSV}
            className="flex items-center gap-2 h-10"
          >
            <Download className="h-4 w-4" />
            Sample CSV
          </Button>
        </div>
        {errors.withdrawFile && (
          <p className="text-sm font-medium text-destructive">
            {errors.withdrawFile.message}
          </p>
        )}
        {fileName && (
          <p className="text-sm text-muted-foreground">
            Selected file: {fileName}
          </p>
        )}
        {filePreview.length > 0 && (
          <div className="mt-2 p-2 bg-muted rounded-md">
            <pre className="text-xs overflow-auto max-h-40">
              {filePreview.join("\n")}
            </pre>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pin">Transaction PIN</Label>
          <div className="relative">
            <Input
              id="pin"
              type={showPin ? "text" : "password"}
              placeholder="Enter your PIN"
              className="h-10 pr-10"
              {...register("pin", {
                required: "Transaction PIN is required",
                minLength: {
                  value: 4,
                  message: "PIN must be at least 4 characters",
                },
                maxLength: {
                  value: 6,
                  message: "PIN must be at most 6 characters",
                },
                pattern: {
                  value: /^\d+$/,
                  message: "PIN must contain only numbers",
                },
              })}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-1/2 right-2 -translate-y-1/2 text-xs h-8 px-2"
              onClick={() => setShowPin((prev) => !prev)}
            >
              {showPin ? "Hide" : "Show"}
            </Button>
          </div>
          {errors.pin && (
            <p className="text-sm font-medium text-destructive">
              {errors.pin.message}
            </p>
          )}
        </div>

        <div className="flex items-end">
          <Button type="submit" className="w-250 h-10" disabled={!isValid}>
            Buy Shares
          </Button>
        </div>
      </div>
    </form>
  );
};

export default BulkShareForm;
