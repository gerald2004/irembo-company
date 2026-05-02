import BulkProcessor from "../../Components/BulkProcessor";

const BulkSavingDepositForm = () => (
  <BulkProcessor
    endpoint="bulk/deposits"
    csvColumns={["account_number", "amount", "reference"]}
    sampleRows={[
      ["ACC001234", "50000", "FIELD-COLL-001"],
      ["ACC005678", "75000", "FIELD-COLL-002"],
    ]}
    submitLabel="Process Deposits"
  />
);

export default BulkSavingDepositForm;
