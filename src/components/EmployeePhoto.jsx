import React from "react";

const getInitials = (name) => {
  if (!name) {
    return "U";
  }

  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

function EmployeePhoto({
  src,
  name,
  className = "employee-avatar",
  alt,
}) {
  if (src) {
    return (
      <div className={className}>
        <img
          src={src}
          alt={alt || name || "Employee photo"}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {getInitials(name)}
    </div>
  );
}

export default EmployeePhoto;
