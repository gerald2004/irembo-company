import BulkProcessor from "../../Components/BulkProcessor";

const BulkTransferForm = () => (
  <BulkProcessor
    endpoint="bulk/transfers"
    csvColumns={["from_account", "to_account", "amount", "reference"]}
    sampleRows={[
      ["ACC001234", "ACC005678", "30000", "TRF-001"],
      ["ACC009012", "ACC003456", "15000", "TRF-002"],
    ]}
    submitLabel="Process Transfers"
  />
);

export default BulkTransferForm;
