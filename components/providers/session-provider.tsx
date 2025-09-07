"use client";

import { ReactNode } from "react";

// For now, we'll use a simple context provider
// Better-auth handles session management internally
export function SessionProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
