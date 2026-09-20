import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Early Student Support System (ESS) | College Intelligence Platform',
  description: 'AI-driven early intervention, risk trajectory monitoring, and student success analytics.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
