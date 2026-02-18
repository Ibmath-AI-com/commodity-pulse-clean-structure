import * as React from "react";

export function LoginLayout({
  background,
  children,
}: {
  background?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {background}
      {children}
    </div>
  );
}
