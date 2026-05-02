import BulkProcessor from "../../Components/BulkProcessor";

const BulkShareForm = () => (
  <BulkProcessor
    endpoint="bulk/shares"
    csvColumns={["account_number", "quantity", "reference"]}
    sampleRows={[
      ["ACC001234", "10", "SHR-2025-001"],
      ["ACC005678", "5", "SHR-2025-002"],
    ]}
    submitLabel="Buy Shares"
  />
);

export default BulkShareForm;
