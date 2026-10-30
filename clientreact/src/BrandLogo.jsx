import React from "react";

const MAUVE = "#e2c3dc";
const PLUM = "#4a1f45";

// SRI.CR mark: rounded square with a dotted "S", beside the wordmark.
export function LogoMark({ size = 40, onLight = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label="SRI.CR logo"
      style={{ flexShrink: 0 }}>
      <rect width="40" height="40" rx="10" fill={onLight ? PLUM : MAUVE} />
      <path
        d="M23.5 14.6C22.4 12.8 20.6 11.8 18.5 11.8 15.8 11.8 13.8 13.4 13.8 15.6 13.8 19.8 23.4 18.4 23.4 24.4 23.4 26.8 21.3 28.4 18.6 28.4 16.3 28.4 14.4 27.3 13.5 25.4"
        fill="none"
        stroke={onLight ? MAUVE : PLUM}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="29.6" cy="27.2" r="2.3" fill={onLight ? MAUVE : PLUM} />
    </svg>
  );
}

export default function BrandLogo({ size = 40, caption = "User management", spaced = true, onLight = false }) {
  return (
    <div className="brand-logo" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: spaced ? "22px" : 0 }}>
      <LogoMark size={size} onLight={onLight} />
      <div className="brand-text" style={{ lineHeight: 1.15 }}>
        <div
          style={{
            fontSize: `${size * 0.6}px`,
            fontWeight: 700,
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
          }}>
          <span style={{ color: onLight ? "#6a2c5e" : MAUVE }}>SRI</span>
          <span style={{ color: onLight ? "#2a1530" : "#fff" }}>.CR</span>
        </div>
        {caption && (
          <div style={{ fontSize: "0.65rem", opacity: 0.65, letterSpacing: "0.04em" }}>
            {caption}
          </div>
        )}
      </div>
    </div>
  );
}
