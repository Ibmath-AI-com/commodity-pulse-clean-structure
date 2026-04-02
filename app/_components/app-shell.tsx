"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Settings, LogOut, User, Users, Menu } from "lucide-react";

import { logOut } from "@/app/(auth)/actions";
import {
  DEFAULT_COMMODITY,
  getStoredCommodity,
  subscribeStoredCommodity,
} from "@/lib/common/commodity-preference";

type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Home" },
  { href: "/prediction", label: "Prediction" },
  { href: "/upload", label: "Upload" },
  { href: "/report", label: "Report" },
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
  userEmail?: string | null;
  userName?: string | null;
  onOpenMobileSidebar?: () => void;
}) {
  const { title, children, userEmail = null, userName = null, onOpenMobileSidebar } = props;

  const pathname = usePathname();
  const [selectedCommodity, setSelectedCommodity] = useState<string>(() =>
    typeof window === "undefined" ? DEFAULT_COMMODITY : getStoredCommodity()
  );
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    isAdmin: boolean;
  } | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const res = await fetch("/api/auth/me", { method: "GET", cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setCurrentUser(null);
          return;
        }

        const json = (await res.json()) as {
          ok: boolean;
          user?: { name: string; email: string; isAdmin: boolean };
        };

        if (!cancelled && json.ok && json.user) {
          setCurrentUser(json.user);
        }
      } catch {
        if (!cancelled) setCurrentUser(null);
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
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
    return subscribeStoredCommodity((value) => setSelectedCommodity(value));
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

  const resolvedEmail = currentUser?.email ?? userEmail ?? null;
  const resolvedName = currentUser?.name ?? userName ?? null;
  const isAdmin = Boolean(currentUser?.isAdmin);
  const initials = useMemo(() => initialsFromEmailOrName(resolvedEmail, resolvedName), [resolvedEmail, resolvedName]);
  const displayLabel = useMemo(() => (resolvedName ?? "").trim() || initials, [resolvedName, initials]);

  return (
    <div className="tt-terminal">
      <header className="dashboard-topbar">
        <div className="dashboard-topbar-left">
          <Link href="/dashboard" className="dashboard-logo-mark">
            <span className="dashboard-logo-badge">
              <Image
                src="/logo_white.png"
                alt="Cali Commodity logo"
                width={18}
                height={18}
                className="dashboard-logo-image"
              />
            </span>
            <span className="dashboard-logo-title">Cali Commodity</span>
          </Link>

          <span className="dashboard-topbar-divider" aria-hidden="true" />

          <div className="dashboard-status-chip">
            <span className="dashboard-status-dot" aria-hidden="true" />
            ACTIVE
          </div>

          <span className="dashboard-topbar-commodity">
            {titleCase(selectedCommodity) || titleCase(DEFAULT_COMMODITY)}
          </span>
          <span className="dashboard-topbar-pipe" aria-hidden="true">
            |
          </span>
          <span className="dashboard-topbar-update">Updated 2 mins ago</span>
          <span className="dashboard-topbar-pipe" aria-hidden="true">
            |
          </span>
          <span className="dashboard-topbar-region">Region: Middle East</span>
        </div>

        <div className="dashboard-topbar-right">
          <span className="dashboard-topbar-time">{timeText}</span>

          <button className="dashboard-notif-btn" type="button" title="Notifications" aria-label="Notifications">
            <Bell  />
          </button>

          <div className="tt-settingsWrap" ref={userRef}>
            <button
              className={cx("dashboard-avatar", userOpen && "dashboard-avatar-active")}
              type="button"
              aria-label="User menu"
              onClick={() => setUserOpen((v) => !v)}
            >
              <span aria-hidden="true" className="dashboard-avatar-text">
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
                      {resolvedEmail || "--"}
                    </span>
                  </span>
                </div>

                <div className="tt-menuDivider" />

                {isAdmin ? (
                  <>
                    <Link className="tt-menuItem" href="/users" onClick={() => setUserOpen(false)}>
                      <Users className="tt-menuIcon" />
                      Users
                    </Link>

                    <div className="tt-menuDivider" />
                  </>
                ) : null}

                <div className="tt-menuDivider" />

                <form action={logOut}>
                  <button className="tt-menuItem tt-menuDanger" type="submit">
                    <LogOut className="tt-menuIcon" />
                    Log out
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <nav className="dashboard-nav-tabs">
        {onOpenMobileSidebar ? (
          <button
            type="button"
            className="dashboard-nav-mobileMenu md:hidden"
            onClick={onOpenMobileSidebar}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        ) : null}

        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cx("dashboard-nav-tab", isActive(pathname, item.href) && "dashboard-nav-tab-active")}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="tt-main">
        {title ? <div className="tt-pageTitle">{title}</div> : null}
        {children}
      </main>

      <footer className="tt-footer">(c) {now.getFullYear()} Commodity Pulse | Market data delayed by 15 minutes | For professional use only</footer>
    </div>
  );
}
