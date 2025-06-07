/* eslint-disable react/prop-types */
const ProfilePicture = ({ name }) => {
  // Function to generate initials from name
  const getInitials = (name) => {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("");
    return initials.toUpperCase();
  };

  // Generate random background color
  const randomColor = () => {
    const colors = ["#000000", "#000000", "#000000", "#000000"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div
      style={{
        backgroundColor: randomColor(),
        color: "#fff",
        borderRadius: "50%",
        width: "30px",
        height: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "15px",
        fontWeight: "bold",
      }}
    >
      {getInitials(name)}
    </div>
  );
};

export default ProfilePicture;
