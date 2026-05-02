import BulkProcessor from "../../Components/BulkProcessor";

const LoanApplicationForm = () => (
  <BulkProcessor
    endpoint="bulk/loan-applications"
    csvColumns={["client_phone", "loan_product_id", "amount", "tenure_months", "purpose"]}
    sampleRows={[
      ["0701234567", "1", "2000000", "12", "Business expansion"],
      ["0789012345", "2", "1500000", "6", "School fees"],
    ]}
    submitLabel="Submit Applications"
  />
);

export default LoanApplicationForm;
