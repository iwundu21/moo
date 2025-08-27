'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockUser } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Star, Hourglass, Rocket,Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


export default function Home({}) {
  const [mainBalance, setMainBalance] = useState(mockUser.mainBalance);
  const [pendingBalance, setPendingBalance] = useState(mockUser.pendingBalance);
  const [isClient, setIsClient] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const earnInterval = setInterval(() => {
      setPendingBalance((prev) => prev + Math.random() * 5);
    }, 2000);

    return () => clearInterval(earnInterval);
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;

    const updateCountdown = () => {
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 1, 0, 0, 0);
      const secondsUntilNextHour = Math.floor((nextHour.getTime() - now.getTime()) / 1000);
      setCountdown(secondsUntilNextHour);

      if (secondsUntilNextHour === 3600) { // Top of the hour
        setMainBalance((prev) => prev + pendingBalance);
        setPendingBalance(0);
      }
    };

    updateCountdown(); // Initial call
    const countdownInterval = setInterval(updateCountdown, 1000);

    return () => clearInterval(countdownInterval);
  }, [isClient, pendingBalance]);
  
  if (!isClient) {
    return null;
  }

  const formatCountdown = (seconds: number | null) => {
    if (seconds === null) return '00:00:00';
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
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
                <div className="text-xs text-amber-500 flex items-center mt-2">
                    <Hourglass className="mr-2 animate-spin" />
                    Crediting in: {formatCountdown(countdown)}
                </div>
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
         <Card>
            <CardHeader>
                <CardTitle>Boost Chat Earning</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    Increase your earning speed per message in group chats.
                </p>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="w-full" variant="outline">
                            <Rocket className="mr-2" /> Boost Earning
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Boost Your Chat Earning</DialogTitle>
                        <DialogDescription>
                            Select a boost to purchase and increase your earning speed per message.
                        </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 gap-4 py-4">
                            <Button variant="default" className="w-full justify-between">
                                <span>2x Boost (24h)</span>
                                <span>100 <Star className="inline-block ml-1 fill-yellow-400 text-yellow-500"/></span>
                            </Button>
                            <Button variant="default" className="w-full justify-between">
                                <span>5x Boost (24h)</span>
                                <span>200 <Star className="inline-block ml-1 fill-yellow-400 text-yellow-500"/></span>
                            </Button>
                            <Button variant="default" className="w-full justify-between">
                                <span>10x Boost (24h)</span>
                                <span>350 <Star className="inline-block ml-1 fill-yellow-400 text-yellow-500"/></span>
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
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
