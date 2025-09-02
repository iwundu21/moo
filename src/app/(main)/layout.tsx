
import type {Metadata} from 'next';
import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FooterNav } from '@/components/layout/FooterNav';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import Script from 'next/script';
import Image from 'next/image';

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={cn("font-body antialiased", inter.variable)}>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <div className="flex flex-col min-h-screen">
          <header className="p-4 flex justify-end">
            <Image
              src="/moo logo.jpg"
              alt="MOO Logo"
              width={50}
              height={50}
              className="rounded-full"
            />
          </header>
          <main className="flex-1 pb-24">{children}</main>
          <FooterNav />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
