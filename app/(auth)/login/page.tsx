"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { logIn } from "../actions";
import { ensureStoredCommodity } from "@/lib/common/commodity-preference";

const features = [
  {
    label: "96% directional accuracy over 30 days",
    icon: <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />,
  },
  {
    label: "Real-time signals updated every 15 mins",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),
  },
  {
    label: "Enterprise-grade security & data privacy",
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
];

export default function LoginPage() {
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverflowY = document.body.style.overflowY;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlOverflowY = document.documentElement.style.overflowY;

    document.body.style.overflow = "auto";
    document.body.style.overflowY = "auto";
    document.documentElement.style.overflow = "auto";
    document.documentElement.style.overflowY = "auto";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overflowY = previousBodyOverflowY;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.overflowY = previousHtmlOverflowY;
    };
  }, []);

  useEffect(() => {
    ensureStoredCommodity();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const formData = new FormData(e.currentTarget);

    setError(undefined);
    setLoading(true);

    const res = await logIn(formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  return (
    <div className="login-page min-h-dvh overflow-y-auto">
      <div className="login-grid min-h-dvh">
        <section className="login-left-section flex-col">
          <div className="login-background-overlay">
            <div className="login-background-grid" />
            <div className="login-background-circle-1" />
            <div className="login-background-circle-2" />
            <div className="login-background-circle-3" />
          </div>

          <div className="login-logo-section">
            <div className="login-logo-container">
              <Image
                src="/logo_white.png"
                alt="Cali Commodity logo"
                width={50}
                height={50}
                className="login-logo-image"
              />
            </div>

            <div>
              <div className="login-brand-name">
                Cali Commodity
              </div>
              <div className="login-brand-subtitle">
                For Agricultural & Fertilizers Trading
              </div>
            </div>
          </div>

          <div className="login-content-section">
            <h1 className="login-main-heading">
              Clear forecasts.
              <br />
              Smarter trades.
            </h1>

            <p className="login-description">
              Join professional traders who rely on AI-powered commodity analysis to make faster, more accurate
              decisions.
            </p>

            <div className="login-features-list flex-col">
              {features.map((item) => (
                <div
                  key={item.label}
                  className="login-feature-item"
                >
                  <div className="login-feature-icon-container">
                    <svg
                      className="login-feature-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      {item.icon}
                    </svg>
                  </div>
                  <span className="login-feature-text">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

        </section>

        <section className="login-right-section items-start justify-center">
          <div className="login-form-container w-full">
            <div className="login-header-section">
              <div className="login-status-indicator">
                <div className="login-status-dot" />
                <span className="login-status-text">
                  Commodity Analysis
                </span>
              </div>

              <h1 className="login-welcome-heading">Welcome back</h1>
              <p className="login-welcome-text">
                Sign in to access your forecasts and market intelligence
              </p>
            </div>

            {error ? (
              <div className="login-error-message">
                {error}
              </div>
            ) : null}

            <form onSubmit={onSubmit}>
              <div className="login-form-field">
                <label
                  htmlFor="email"
                  className="ui-form-label"
                >
                  Email Address
                </label>
                <div className="ui-form-control-wrap">
                  <span className="ui-form-control-icon">
                    <svg
                      className="h-[18px] w-[18px]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@caliagricultural.com"
                    className="ui-form-control ui-form-control-with-icon"
                  />
                </div>
              </div>

              <div className="login-form-field">
                <label
                  htmlFor="password"
                  className="ui-form-label"
                >
                  Password
                </label>
                <div className="ui-form-control-wrap">
                  <span className="ui-form-control-icon">
                    <svg
                      className="h-[18px] w-[18px]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="ui-form-control ui-form-control-with-icon"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="ui-primary-button mt-3"
              >
                {loading ? (
                  <>
                    <svg className="h-[18px] w-[18px] animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-20" />
                      <path
                        d="M22 12a10 10 0 0 1-10 10"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="opacity-90"
                      />
                    </svg>
                    Logging in...
                  </>
                ) : (
                  <>
                    Start Analysis
                    <svg
                      className="h-[18px] w-[18px]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M5 12h14" />
                      <path d="M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>
           
          </div>
          <div className="login-footer">
              Powered by Cali Agricultural | Copyright 2026
            </div>
        </section>
      </div>
    </div>
  );
}
