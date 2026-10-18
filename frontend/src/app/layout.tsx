import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'VoiceBroadcastPro | Next-Gen Enterprise Voice & Reseller PBX',
  description: 'Enterprise Voice Broadcasting, Multi-Level Reseller Management, and Real-Time Asterisk Engine',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 min-h-screen antialiased text-slate-900 font-sans flex font-semibold">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
