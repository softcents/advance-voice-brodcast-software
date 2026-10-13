'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { AuthProvider } from '@/context/AuthContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <AuthProvider>
      {isAuthPage ? (
        <main className="min-h-screen w-full bg-surface-dark">{children}</main>
      ) : (
        <div className="flex min-h-screen w-full bg-surface-dark">
          <Sidebar />
          <div className="flex-1 ml-64 flex flex-col min-h-screen">
            <Header />
            <main className="p-8 flex-1">{children}</main>
          </div>
        </div>
      )}
    </AuthProvider>
  );
}
