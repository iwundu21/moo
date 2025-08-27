'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gift, Users, Trophy, User as ProfileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/airdrop', icon: Gift, label: 'Airdrop' },
  { href: '/referrals', icon: Users, label: 'Refs' },
  { href: '/leaderboard', icon: Trophy, label: 'Top' },
  { href: '/profile', icon: ProfileIcon, label: 'Profile' },
];

export function FooterNav() {
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t z-50">
      <nav className="flex justify-around max-w-lg mx-auto px-2 pt-2 pb-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg p-1 transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                )}
              >
                <div className={cn("p-2 rounded-full transition-colors duration-200", isActive && "bg-primary text-primary-foreground")}>
                    <item.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
