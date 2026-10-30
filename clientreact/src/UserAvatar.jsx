import React from "react";

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function UserAvatar({ name, imageUrl, size = 40 }) {
  const initials = getInitials(name);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name || "User Avatar"}
        className="user-avatar"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div className="user-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initials}
    </div>
  );
}
