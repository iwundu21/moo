
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
        <div 
            className="flex flex-col min-h-screen bg-cover bg-center bg-fixed"
            style={{ backgroundImage: "url('/color.jpg')" }}
        >
          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-lg items-center justify-between">
               <p className="text-xl font-bold">MOO</p>
               <Image
                  src="/moo logo.jpg"
                  alt="MOO Logo"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
            </div>
          </header>
          <main className="flex-1 pb-24">{children}</main>
          <FooterNav />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
