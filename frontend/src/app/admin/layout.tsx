/**
 * Admin Layout - Next.js Layout File
 * 
 * This file is automatically applied to all pages under /admin/*
 * It simply passes through children without adding any layout.
 * 
 * Individual pages use the AdminLayout component directly for layout.
 */

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
