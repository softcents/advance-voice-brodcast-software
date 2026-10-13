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
    <html lang="en" className="dark">
      <body className="bg-surface-dark min-h-screen antialiased text-gray-100 flex">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
