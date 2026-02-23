"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Settings, LogOut, User } from "lucide-react";

const LS_COMMODITY = "ai_commodity_selected";

type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "DASHBOARD" },
  { href: "/prediction", label: "PREDICTION" },
  { href: "/upload", label: "UPLOAD" },
  { href: "/report", label: "REPORT" },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href);
}

function titleCase(s: string) {
  const x = (s ?? "").trim();
  if (!x) return "";
  return x.charAt(0).toUpperCase() + x.slice(1);
}

function initialsFromEmailOrName(email?: string | null, name?: string | null) {
  const src = String(name ?? "").trim() || String(email ?? "").trim();
  if (!src) return "U";
  const beforeAt = src.includes("@") ? src.split("@")[0] : src;
  const cleaned = beforeAt.replace(/[^a-zA-Z0-9 ]/g, " ").trim();
  if (!cleaned) return "U";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const two =
    parts.length >= 2 ? parts[0][0] + parts[1][0] : cleaned.length >= 2 ? cleaned.slice(0, 2) : cleaned.slice(0, 1);
  return two.toUpperCase();
}

export function AppShell(props: {
  title?: string;
  children: React.ReactNode;

  // display only (provided by layout/page)
  userEmail?: string | null;
  userName?: string | null;

  // server action (passed from layout)
  //logoutAction: () => Promise<void>;
}) {
  const { title, children, userEmail = null, userName = null } = props;

  const pathname = usePathname();
  const [selectedCommodity, setSelectedCommodity] = useState<string>("");

  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement | null>(null);

  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeText = useMemo(() => {
    try {
      const parts = new Intl.DateTimeFormat("en-AU", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZoneName: "short",
      }).formatToParts(now);

      const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
      return `${get("weekday").toUpperCase()} ${get("day")} ${get("month").toUpperCase()} ${get("year")} | ${get(
        "hour"
      )}:${get("minute")}:${get("second")} ${get("timeZoneName")}`;
    } catch {
      return now.toISOString();
    }
  }, [now]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const read = () => {
      const v = (window.localStorage.getItem(LS_COMMODITY) ?? "").trim();
      setSelectedCommodity(v);
    };

    read();

    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_COMMODITY) read();
    };
    const onCommodityEvent: EventListener = () => read();

    window.addEventListener("storage", onStorage);
    window.addEventListener("ai:commodity", onCommodityEvent);


    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("ai:commodity", onCommodityEvent);
    };
  }, []);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!userRef.current) return;
      if (!userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setUserOpen(false);
    }

    if (userOpen) {
      document.addEventListener("mousedown", onDocDown);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [userOpen]);

  const initials = useMemo(() => initialsFromEmailOrName(userEmail, userName), [userEmail, userName]);
  const displayLabel = useMemo(() => (userName ?? "").trim() || initials, [userName, initials]);

  return (
    <div className="tt-terminal">
      <header>
        <div className="header-left">
          <div className="logo">
            <span>C</span> Commodity Pulse
          </div>
          <div className="status-pill">
            ACTIVE <span className="separater">|</span>{" "}
            <span className="tt-tickerValue tt-tickerUp">{titleCase(selectedCommodity)}</span>
          </div>
          <div className="status-pill">Updated 2 mins ago</div>
          <div className="status-pill">
            Region: <strong>Middle East</strong>
          </div>
        </div>

        <div className="header-right">
          <div className="tt-userSection">
            <span className="status-pill">{timeText}</span>

            <button className="tt-iconBtn" type="button" title="Notifications" aria-label="Notifications">
              <Bell className="tt-icon" />
            </button>

            <div className="tt-settingsWrap" ref={userRef}>
              <button
                className={cx("tt-iconBtn", userOpen && "tt-iconBtnActive")}
                type="button"
                aria-label="User menu"
                onClick={() => setUserOpen((v) => !v)}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 0.4,
                    color: "#172b4d",
                    background: "#deebff",
                    border: "1px solid #b3d4ff",
                  }}
                >
                  {initials}
                </span>
              </button>

              {userOpen ? (
                <div className="tt-menu">
                  <div className="tt-menuHeader">ACCOUNT</div>

                  <div className="tt-menuItem" style={{ cursor: "default" as const }}>
                    <User className="tt-menuIcon" />
                    <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                      <span style={{ fontWeight: 800, color: "#172b4d" }}>{displayLabel}</span>
                      <span style={{ fontSize: 12, color: "#5e6c84", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {userEmail || "—"}
                      </span>
                    </span>
                  </div>

                  <div className="tt-menuDivider" />

                  <Link className="tt-menuItem" href="/settings" onClick={() => setUserOpen(false)}>
                    <Settings className="tt-menuIcon" />
                    Settings
                  </Link>

                  <div className="tt-menuDivider" />

                  {/* ✅ server action trigger */}
                  <form >{/*action={logoutAction}*/}
                    <button className="tt-menuItem tt-menuDanger" type="submit">
                      <LogOut className="tt-menuIcon" />
                      Log out
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <nav className="tt-nav ml-10">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className={cx("tt-navLink", isActive(pathname, item.href) && "tt-navLinkActive")}>
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="tt-main">
        {title ? <div className="tt-pageTitle">{title}</div> : null}
        {children}
      </main>

      <footer className="tt-footer">© {now.getFullYear()} Commodity Pulse | Market data delayed by 15 minutes | For professional use only</footer>
    </div>
  );
}
