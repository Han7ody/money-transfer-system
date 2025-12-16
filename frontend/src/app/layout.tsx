import type { Metadata } from "next";
import { Toaster } from 'react-hot-toast';
import "./globals.css";

export const metadata: Metadata = {
  title: "راصد | نظام راصد لتحويل الأموال",
  description: "نظام راصد لتحويل الأموال بسرعة وأمان",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning={true}>
      <body className="antialiased" suppressHydrationWarning={true}>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#1e293b',
              fontFamily: 'IBM Plex Sans Arabic, system-ui, -apple-system, sans-serif',
              direction: 'rtl',
              fontSize: '14px',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              border: '1px solid #e2e8f0',
              padding: '16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
