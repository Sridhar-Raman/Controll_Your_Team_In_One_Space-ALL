import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Password field with an eye button that shows or hides the text.
// Takes the same props as <input>; `defaultVisible` starts it unmasked.
export default function PasswordInput({
  className = "",
  style,
  defaultVisible = false,
  ...props
}) {
  const [visible, setVisible] = useState(defaultVisible);

  return (
    <div style={{ position: "relative", width: "100%", minWidth: 0 }}>
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={className}
        // Leave room on the right so text never runs under the eye button.
        style={{ ...style, width: "100%", boxSizing: "border-box", paddingRight: 42 }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        title={visible ? "Hide password" : "Show password"}
        style={{
          position: "absolute",
          top: "50%",
          right: 6,
          transform: "translateY(-50%)",
          width: 30,
          height: 30,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          border: "none",
          borderRadius: 6,
          background: "transparent",
          color: "rgba(74,31,69,0.55)",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#5c2252")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(74,31,69,0.55)")}>
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
