import BulkProcessor from "../../Components/BulkProcessor";

const BulkGroupRegistrationForm = () => (
  <BulkProcessor
    endpoint="bulk/group-registrations"
    csvColumns={["group_name", "phone", "email", "address"]}
    sampleRows={[
      ["Kampala Women Savers", "0701234567", "kws@mail.com", "Kampala Central"],
      ["Jinja Traders Group", "0789012345", "", "Jinja Town"],
    ]}
    submitLabel="Register Groups"
  />
);

export default BulkGroupRegistrationForm;
