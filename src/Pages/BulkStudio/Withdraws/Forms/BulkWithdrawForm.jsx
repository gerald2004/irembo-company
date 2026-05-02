import BulkProcessor from "../../Components/BulkProcessor";

const BulkWithdrawForm = () => (
  <BulkProcessor
    endpoint="bulk/withdrawals"
    csvColumns={["account_number", "amount", "reference"]}
    sampleRows={[
      ["ACC001234", "20000", "WTHDRW-001"],
      ["ACC005678", "45000", "WTHDRW-002"],
    ]}
    submitLabel="Process Withdrawals"
  />
);

export default BulkWithdrawForm;
