//E:\AI Projects\commodity-clean-structure\app\(auth)\login\page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginBackground from '@/app/_components/LoginBackground';
import { logIn } from '../actions';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const formData = new FormData(e.currentTarget);

    setLoading(true);
    const res = await logIn(formData);
    if (res?.error) setError(res.error);
    setLoading(false);
  }

function handleHome(e: React.MouseEvent<HTMLButtonElement>) {
  e.preventDefault();
  router.push("/dashboard"); 
}

  return (
    <div style={{ background: "transparent", minHeight: "100vh", position: "relative" }}>
      <LoginBackground />
      <button type="button" onClick={handleHome} aria-label="Go to home" className="lp-home-btn">
        <svg
          className="lp-home-ico"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
        </svg>
        Home
      </button>

      
      <div className="login-container">
        <div className="login-card-wrapper">
          <div className="glow-border" />
          <div className="login-card">
            <div className="login-card-head">
              <div className="header">
                <h2 className="tt-login-companyRest">Commodity Pulse</h2>
              </div>
            </div>
             {error && <p className="error">{error}</p>}
            <form
              className="form"
               onSubmit={onSubmit} 
            >
              <div className="input-group">
                <input
                  name="email"
                  type="email"
                  className="input"
                  placeholder="Email"
                  required
                  autoComplete="email"
                />
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>

              <div className="input-group">
                <input
                  name="password"
                  type="password"
                  className="input"
                  placeholder="Password"
                  required
                  minLength={6}
                />
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              <button type="submit" className="submit-btn">
                <span>{loading ? 'Login in...' : 'Login in'}</span>
                <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </form>

            <p className="feature-text">
              <span className="highlight">Clear price forecasts.</span> Simple explanations.{" "}
              <span className="highlight">Better decisions.</span>
            </p>
          </div>
        </div>

        <p className="footer">Powered by Commodity Pules</p>
      </div>
    </div>
  );
}
