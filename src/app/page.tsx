'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockUser } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

export default function Home() {
  const [mainBalance, setMainBalance] = useState(mockUser.mainBalance);
  const [pendingBalance, setPendingBalance] = useState(mockUser.pendingBalance);

  useEffect(() => {
    const earnInterval = setInterval(() => {
      setPendingBalance((prev) => prev + Math.random() * 5);
    }, 2000);

    return () => clearInterval(earnInterval);
  }, []);

  useEffect(() => {
    if (pendingBalance > 100) {
      const transferTimeout = setTimeout(() => {
        setMainBalance((prev) => prev + pendingBalance);
        setPendingBalance(0);
      }, 5000); // Wait 5s then transfer

      return () => clearTimeout(transferTimeout);
    }
  }, [pendingBalance]);

  return (
    <div className="container mx-auto p-4 space-y-8 animate-fade-in">
      <header className="flex items-center space-x-4 pt-4">
        <Avatar className="w-16 h-16 border-2 border-primary">
          <AvatarImage src={mockUser.profilePictureUrl} alt={mockUser.telegramUsername} data-ai-hint="profile picture" />
          <AvatarFallback>{mockUser.telegramUsername.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-semibold">@{mockUser.telegramUsername}</p>
        </div>
      </header>

      <div className="text-center">
          <p className="text-xl font-medium text-muted-foreground">Main Balance</p>
          <p className="text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            {mainBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
         <Card>
            <CardHeader>
                <CardTitle>Pending Balance</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-semibold">
                    {pendingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                    This balance will be transferred to your main balance automatically.
                </p>
            </CardContent>
         </Card>
         <Card>
            <CardHeader>
                <CardTitle>Mining License</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    Activate your license to start mining MOO.
                </p>
                <Button className="w-full">
                    Activate for 150 <Star className="ml-2 fill-yellow-400 text-yellow-500" />
                </Button>
            </CardContent>
         </Card>
      </div>

      <div className="flex justify-center pt-8">
        <div className="relative cursor-pointer group">
          <Image src="https://picsum.photos/150/150" alt="MOO Coin" width={150} height={150} className="rounded-full shadow-2xl transition-transform duration-300 group-hover:scale-105" data-ai-hint="coin logo" />
          <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <p className="text-white font-bold text-xl">Tap!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
