import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';

/** Header, content at the same width as the services list, and footer for customer inner pages. */
export function CustomerPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 space-y-6 px-4 py-6">{children}</main>
      <Footer />
    </div>
  );
}
