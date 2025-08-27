import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FooterNav } from '@/components/layout/FooterNav';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'MOO',
  description: 'MOO App by Firebase Studio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn("font-body antialiased", inter.variable)}>
        <div className="flex flex-col min-h-screen">
          <main className="flex-1 pb-24">{children}</main>
          <FooterNav />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
