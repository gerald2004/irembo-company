
export function getInitials(fullName) {
  if (!fullName) return ""; // Return empty string if no name
  const nameParts = fullName.trim().split(" ");
  const initials = nameParts.map((part) => part.charAt(0).toUpperCase()).join(".");
  return initials; // Example: I.B.
}