import React from "react";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const titleOf = (page) =>
  page === "eod"
    ? "EOD Reports"
    : page.charAt(0).toUpperCase() + page.slice(1).replace(/-/g, " ");

// Heading at the top of every screen. The dashboard gets a greeting and the
// date; other screens just show their title.
export default function PageHeading({ page, name }) {
  if (page === "dashboard") {
    const firstName = (name || "").split(" ")[0];
    return (
      <div>
        <h1>
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <div className="page-heading-sub">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>
    );
  }
  return <h1>{titleOf(page)}</h1>;
}
