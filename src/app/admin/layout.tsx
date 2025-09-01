
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'MOO Admin',
  description: 'Admin Dashboard for MOO App',
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
     <html lang="en" className="dark" suppressHydrationWarning>
      <body className={cn("font-body antialiased", inter.variable)}>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <div className="flex flex-col min-h-screen bg-background">
            <main className="flex-1">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
