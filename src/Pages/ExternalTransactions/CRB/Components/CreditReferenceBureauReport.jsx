import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CreditReferenceBureauView from "./Forms/CreditReferenceBureauView";

const CreditReferenceBureauReport = () => {
  const [openDialogIndex, setOpenDialogIndex] = useState(null);
  const [selectedReportTitle, setSelectedReportTitle] = useState("");

  const reports = [
    { title: "Individual Customer Credit Report Check", price: "12,000 UGX" },
    {
      title: "Business Credit Report (Company and Partnerships)",
      price: "12,000 UGX",
    },
    { title: "No Credit Data Report", price: "6,000 UGX" },
    { title: "Mobile Credit Score & CRB Score", price: "3,000 UGX" },
    {
      title: "Identification Validation (NIRA, NIN Validation)",
      price: "1,000 UGX",
    },
    {
      title: "Contact Validation for both Airtel and MTN numbers",
      price: "600 UGX",
    },
    { title: "KYC Validation and Report", price: "1,000 UGX" },
    { title: "FCS Validation", price: "FREE" },
    { title: "Letter of Affirmation", price: "60,000" },
  ];

  const handleOpenDialog = (index, title) => {
    setSelectedReportTitle(title);
    setOpenDialogIndex(index);
  };

  return (
    <div className=" mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reports.map((report, index) => (
        <Card key={index} className="flex flex-col justify-between h-full">
          <CardHeader>
            <CardTitle className="text-lg">{report.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex justify-between items-end">
            <p className="text-sm text-muted-foreground font-medium">
              Cost:{" "}
              <span className="text-primary font-semibold">{report.price}</span>
            </p>
            <Button size="sm" onClick={() => handleOpenDialog(index, report.title)}>
              View Report
            </Button>
          </CardContent>
          {openDialogIndex === index && (
            <CreditReferenceBureauView
              isOpen={openDialogIndex === index}
              onClose={() => setOpenDialogIndex(null)}
              reportTitle={selectedReportTitle}
            />
          )}
        </Card>
      ))}
    </div>
  );
};

export default CreditReferenceBureauReport;
