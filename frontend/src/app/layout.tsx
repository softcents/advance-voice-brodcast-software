import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

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
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col min-h-screen">
          <Header />
          <main className="p-8 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
