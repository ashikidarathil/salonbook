import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';

/** Header, full-width content and footer for customer inner pages. */
export function CustomerPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="w-full flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      <Footer />
    </div>
  );
}
