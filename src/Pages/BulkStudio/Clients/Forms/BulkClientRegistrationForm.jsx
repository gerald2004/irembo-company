import BulkProcessor from "../../Components/BulkProcessor";

const BulkClientRegistrationForm = () => (
  <BulkProcessor
    endpoint="bulk/client-registrations"
    csvColumns={["firstname", "lastname", "gender", "date_of_birth", "phone", "email", "address", "national_id"]}
    sampleRows={[
      ["Jane", "Nakato", "Female", "1990-05-15", "0701234567", "jane@example.com", "Kampala", "CM900515001234"],
      ["John", "Ssemakula", "Male", "1985-11-22", "0789012345", "", "Entebbe", ""],
    ]}
    submitLabel="Register Clients"
  />
);

export default BulkClientRegistrationForm;
