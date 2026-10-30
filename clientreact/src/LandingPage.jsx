import React, { useRef, useState } from "react";
import {
  ChevronUp,
  CalendarCheck,
  Clock,
  CalendarDays,
  FileText,
  MessageSquare,
  BarChart3,
  Shield,
  Briefcase,
  Users,
  User,
  Check,
  ArrowRight,
} from "lucide-react";
import BrandLogo from "./BrandLogo";

const FEATURES = [
  {
    icon: CalendarCheck,
    tone: ["#eadbe6", "#6a2c5e"],
    title: "Task assignment",
    text: "Assign work with deadlines, watch status move from Pending to Completed, and see who is overloaded at a glance.",
  },
  {
    icon: Clock,
    tone: ["#f3e3c4", "#a8741a"],
    title: "Automatic attendance",
    text: "The time tracker starts when people log in. Daily hours and punctuality are recorded without a check-in button.",
  },
  {
    icon: CalendarDays,
    tone: ["#d9ebe0", "#2f7d4f"],
    title: "Leave management",
    text: "Request leave, track balances, and let admins approve or reject requests from one pipeline.",
  },
  {
    icon: FileText,
    tone: ["#f7d9d9", "#b23b3b"],
    title: "End-of-day reports",
    text: "Two sessions a day, editable for three days, with blockers surfaced to the people who can clear them.",
  },
  {
    icon: MessageSquare,
    tone: ["#eadbe6", "#6a2c5e"],
    title: "Team messenger",
    text: "A company-wide channel plus private conversations, with file sharing, edit and delete.",
  },
  {
    icon: BarChart3,
    tone: ["#f3e3c4", "#a8741a"],
    title: "Performance insight",
    text: "Efficiency, reliability and activity views for managers and leads, built from real task and attendance data.",
  },
];

const ROLES = [
  {
    icon: Shield,
    name: "Admin",
    points: ["Create and approve accounts", "Assign tasks to anyone", "Approve leave and monitor all work"],
  },
  {
    icon: Briefcase,
    name: "Manager",
    points: ["Oversee leads in the department", "Dispatch tasks to leads", "Analytics and organization view"],
  },
  {
    icon: Users,
    name: "Lead",
    points: ["Manage your own team", "Assign and track team tasks", "Inspect performance and EOD logs"],
  },
  {
    icon: User,
    name: "Employee",
    points: ["See your tasks and update status", "Attendance, EOD reports and leave", "Message your team"],
  },
];

const PREVIEW_BARS = [34, 62, 48, 80, 56, 70, 44];

function Button({ children, onClick, variant = "primary", large = false }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: large ? 48 : 40,
    padding: large ? "0 26px" : "0 18px",
    borderRadius: 12,
    fontSize: large ? "1rem" : "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid transparent",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  };
  const styles =
    variant === "primary"
      ? { ...base, background: "#5c2252", color: "#fff" }
      : variant === "light"
        ? { ...base, background: "#f4f1ec", color: "#4a1f45" }
        : { ...base, background: "transparent", color: "#2a1530", borderColor: "rgba(74,31,69,0.28)" };
  return (
    <button type="button" onClick={onClick} style={styles}>
      {children}
    </button>
  );
}

function PreviewTile({ label, value, tone }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: "#fbf9f6",
        border: "1px solid rgba(74,31,69,0.1)",
        borderRadius: 14,
        padding: "12px 14px",
      }}>
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          background: tone,
          marginBottom: 8,
        }}
      />
      <div style={{ fontSize: "1.35rem", fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: "0.72rem", color: "#5d4a5b" }}>{label}</div>
    </div>
  );
}

export default function LandingPage({ go }) {
  const pageRef = useRef(null);
  const homeRef = useRef(null);
  const featuresRef = useRef(null);
  const rolesRef = useRef(null);
  const startRef = useRef(null);
  const [showTop, setShowTop] = useState(false);
  const [active, setActive] = useState("home");

  // Menu tabs; each one scrolls to its section.
  const TABS = [
    { id: "home", label: "Home", ref: homeRef },
    { id: "features", label: "Features", ref: featuresRef },
    { id: "roles", label: "Roles", ref: rolesRef },
    { id: "start", label: "Get started", ref: startRef },
  ];

  // The page scrolls inside this container (the app shell never scrolls), so
  // scroll position drives both the highlighted tab and the back-to-top button.
  const onScroll = (e) => {
    const box = e.currentTarget;
    setShowTop(box.scrollTop > 420);

    const boxTop = box.getBoundingClientRect().top;
    const atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 8;
    let current = "home";
    for (const tab of TABS) {
      const el = tab.ref.current;
      if (el && el.getBoundingClientRect().top - boxTop <= 150) current = tab.id;
    }
    setActive(atBottom ? "start" : current);
  };
  const scrollToSection = (ref) =>
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollToTop = () => pageRef.current?.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div
      ref={pageRef}
      onScroll={onScroll}
      style={{
        height: "100dvh",
        overflowY: "auto",
        overflowX: "hidden",
        background: "linear-gradient(180deg, #d9b9cb 0%, #d4b0c5 38%, #e6d3de 100%)",
        color: "#2a1530",
      }}>
      {/* Sticky top navigation: logo, section tabs, account buttons */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <BrandLogo size={40} spaced={false} onLight />
          <nav className="lp-tabs" aria-label="Page sections">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`lp-tab${active === tab.id ? " active" : ""}`}
                aria-current={active === tab.id ? "true" : undefined}
                onClick={() => scrollToSection(tab.ref)}>
                {tab.label}
              </button>
            ))}
          </nav>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="ghost" onClick={() => go("login")}>
              Log in
            </Button>
            <Button onClick={() => go("signup")}>Request access</Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section
          ref={homeRef}
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "40px 24px 64px",
            scrollMarginTop: 90,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))",
            gap: 48,
            alignItems: "center",
          }}>
          <div>
            <span
              style={{
                display: "inline-block",
                padding: "6px 14px",
                borderRadius: 999,
                background: "rgba(92,34,82,0.12)",
                color: "#5c2252",
                fontSize: "0.8rem",
                fontWeight: 600,
                marginBottom: 18,
              }}>
              Team management, simplified
            </span>
            <h1
              style={{
                fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
                lineHeight: 1.08,
                fontWeight: 800,
                margin: 0,
                letterSpacing: "-0.02em",
              }}>
              Run your whole team from one calm workspace.
            </h1>
            <p
              style={{
                fontSize: "1.1rem",
                lineHeight: 1.6,
                color: "#4a3548",
                margin: "20px 0 30px",
                maxWidth: 520,
              }}>
              SRI.CR brings tasks, attendance, leave, daily reports and team chat
              together, with the right view for every role in your company.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button large onClick={() => go("signup")}>
                Request an account <ArrowRight size={18} />
              </Button>
              <Button large variant="ghost" onClick={() => go("login")}>
                Log in
              </Button>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#5d4a5b", marginTop: 16 }}>
              New accounts are reviewed by an administrator before they can sign in.
            </p>
          </div>

          {/* Decorative preview of the product */}
          <div
            aria-hidden="true"
            style={{
              background: "#f4f1ec",
              borderRadius: 22,
              padding: 22,
              boxShadow: "0 30px 70px rgba(74,31,69,0.25)",
              border: "1px solid rgba(74,31,69,0.1)",
            }}>
            <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>Good evening, Alex</div>
            <div style={{ fontSize: "0.78rem", color: "#5d4a5b", marginBottom: 14 }}>
              Wednesday, October 28
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <PreviewTile label="Tasks done" value="12/15" tone="#eadbe6" />
              <PreviewTile label="Hours this week" value="31 hrs" tone="#f3e3c4" />
              <PreviewTile label="Efficiency" value="86%" tone="#d9ebe0" />
            </div>
            <div
              style={{
                background: "#fbf9f6",
                border: "1px solid rgba(74,31,69,0.1)",
                borderRadius: 14,
                padding: "12px 14px 14px",
              }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: 10 }}>
                Hours worked
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 110 }}>
                {PREVIEW_BARS.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      background: "#7d3d71",
                      borderRadius: "6px 6px 0 0",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          ref={featuresRef}
          style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 24px 64px", scrollMarginTop: 90 }}>
          <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", margin: "0 0 8px", fontWeight: 700 }}>
            Everything your team needs day to day
          </h2>
          <p style={{ color: "#4a3548", margin: "0 0 28px", fontSize: "1.05rem" }}>
            Built for how small and mid-sized teams actually work.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
              gap: 18,
            }}>
            {FEATURES.map(({ icon: Icon, tone, title, text }) => (
              <article
                key={title}
                style={{
                  background: "#f4f1ec",
                  border: "1px solid rgba(74,31,69,0.1)",
                  borderRadius: 18,
                  padding: 22,
                  boxShadow: "0 1px 2px rgba(74,31,69,0.06)",
                }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: tone[0],
                    color: tone[1],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                  }}>
                  <Icon size={24} />
                </div>
                <h3 style={{ margin: "0 0 6px", fontSize: "1.1rem" }}>{title}</h3>
                <p style={{ margin: 0, color: "#5d4a5b", lineHeight: 1.55, fontSize: "0.95rem" }}>
                  {text}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section
          ref={rolesRef}
          style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 64px", scrollMarginTop: 90 }}>
          <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", margin: "0 0 8px", fontWeight: 700 }}>
            The right view for every role
          </h2>
          <p style={{ color: "#4a3548", margin: "0 0 28px", fontSize: "1.05rem" }}>
            People only see and do what their role needs.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))",
              gap: 18,
            }}>
            {ROLES.map(({ icon: Icon, name, points }) => (
              <article
                key={name}
                style={{
                  background: "#4a1f45",
                  color: "#fff",
                  borderRadius: 18,
                  padding: 22,
                }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 14,
                    fontSize: "1.15rem",
                    fontWeight: 700,
                  }}>
                  <span
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 11,
                      background: "rgba(255,255,255,0.14)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#e2c3dc",
                    }}>
                    <Icon size={20} />
                  </span>
                  {name}
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 9 }}>
                  {points.map((p) => (
                    <li
                      key={p}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-start",
                        fontSize: "0.92rem",
                        lineHeight: 1.45,
                        color: "#ecdde8",
                      }}>
                      <Check size={16} style={{ flexShrink: 0, marginTop: 2, color: "#e2c3dc" }} />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* Final call to action */}
        {/* Fills the rest of the screen so that every section above (Roles
            included) has enough page below it to scroll up to the top, even on
            tall monitors where the page would otherwise be too short. */}
        <section
          ref={startRef}
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "0 24px 72px",
            scrollMarginTop: 90,
            minHeight: "calc(100dvh - 190px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}>
          <div
            style={{
              background: "#f4f1ec",
              borderRadius: 24,
              padding: "40px 28px",
              textAlign: "center",
              border: "1px solid rgba(74,31,69,0.1)",
              boxShadow: "0 18px 50px rgba(74,31,69,0.14)",
            }}>
            <h2 style={{ margin: "0 0 10px", fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
              Ready to get started?
            </h2>
            <p style={{ margin: "0 auto 24px", color: "#5d4a5b", maxWidth: 520, lineHeight: 1.55 }}>
              Request an account and an administrator will approve it, or log in if
              you already have one.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Button large onClick={() => go("signup")}>
                Request an account
              </Button>
              <Button large variant="ghost" onClick={() => go("login")}>
                Log in
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer
        style={{
          background: "#4a1f45",
          color: "#ecdde8",
          padding: "28px 24px",
        }}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}>
          <BrandLogo size={34} spaced={false} />
          <div style={{ display: "flex", gap: 18, fontSize: "0.9rem" }}>
            <button
              type="button"
              onClick={() => go("login")}
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>
              Log in
            </button>
            <button
              type="button"
              onClick={() => go("signup")}
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>
              Request access
            </button>
          </div>
          <div style={{ fontSize: "0.82rem", opacity: 0.8 }}>
            &copy; {new Date().getFullYear()} SRI.CR. All rights reserved.
          </div>
        </div>
      </footer>

      {/* 3D "back to top" button, shown after scrolling */}
      {showTop && (
        <button
          type="button"
          className="lp-3d-btn lp-3d-round lp-top-btn"
          onClick={scrollToTop}
          aria-label="Back to top">
          <ChevronUp size={24} />
        </button>
      )}
    </div>
  );
}
