
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, Hourglass, Rocket, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge';
import { useTelegram } from '@/hooks/use-telegram';
import { cn } from '@/lib/utils';


const boosts = [
  { id: '2x', multiplier: 2, cost: 100, description: 'Earn 10 MOO per message' },
  { id: '5x', multiplier: 5, cost: 200, description: 'Earn 25 MOO per message' },
  { id: '10x', multiplier: 10, cost: 350, description: 'Earn 50 MOO per message' },
];

export default function Home() {
  const { userProfile, addDistributionRecord } = useTelegram();
  const [mainBalance, setMainBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [activatedBoosts, setActivatedBoosts] = useState<string[]>([]);
  const [isLicenseActive, setIsLicenseActive] = useState(false);

  useEffect(() => {
    if(userProfile) {
      setMainBalance(userProfile.mainBalance);
      setPendingBalance(userProfile.pendingBalance);
      setActivatedBoosts(userProfile.purchasedBoosts);
      setIsLicenseActive(userProfile.isLicenseActive);
    }
  }, [userProfile]);

  useEffect(() => {
    if (!userProfile || !isLicenseActive) return;

    let earnRate = 5; // Base rate for 1x boost from license

    const twoX = activatedBoosts.includes('2x');
    const fiveX = activatedBoosts.includes('5x');
    const tenX = activatedBoosts.includes('10x');

    if (tenX) earnRate = 50;
    else if (fiveX) earnRate = 25;
    else if (twoX) earnRate = 10;
    
    const earnInterval = setInterval(() => {
      setPendingBalance((prev) => prev + (Math.random() * earnRate) / 5 );
    }, 2000);

    return () => clearInterval(earnInterval);
  }, [userProfile, activatedBoosts, isLicenseActive]);

  useEffect(() => {
    if (!userProfile) return;

    const updateCountdown = () => {
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 1, 0, 0, 0);
      const secondsUntilNextHour = Math.floor((nextHour.getTime() - now.getTime()) / 1000);
      setCountdown(secondsUntilNextHour);

      if (now.getMinutes() === 0 && now.getSeconds() === 0 && pendingBalance > 0) { // Top of the hour
        const amountToCredit = pendingBalance;
        setMainBalance((prev) => prev + amountToCredit);
        if (userProfile) userProfile.mainBalance += amountToCredit;
        setPendingBalance(0);
        if (userProfile) userProfile.pendingBalance = 0;
        addDistributionRecord({
          timestamp: new Date(),
          amount: amountToCredit,
        });
      }
    };

    updateCountdown(); // Initial call
    const countdownInterval = setInterval(updateCountdown, 1000);

    return () => clearInterval(countdownInterval);
  }, [userProfile, pendingBalance, addDistributionRecord]);

  const handleBoostPurchase = (boostId: string) => {
    if (activatedBoosts.includes(boostId)) return;
    setActivatedBoosts((prev) => [...prev, boostId]);
    if (userProfile) {
      userProfile.purchasedBoosts = [...userProfile.purchasedBoosts, boostId];
    }
  };

  const handleLicenseActivation = () => {
    if (isLicenseActive) return;
    setIsLicenseActive(true);
    // 1x boost is implicit with the license
    if (userProfile) {
      userProfile.isLicenseActive = true;
    }
  }
  
  if (!userProfile) {
    return null; // Or a loading spinner
  }

  const formatCountdown = (seconds: number | null) => {
    if (seconds === null) return '00:00:00';
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };
  
  const hasPurchasedBoosts = activatedBoosts.length > 0;

  return (
    <div className="container mx-auto p-4 space-y-8">
      <header className="flex items-center space-x-4 pt-4">
        <Avatar className="w-16 h-16 border-2 border-primary">
          <AvatarImage src={userProfile.profilePictureUrl} alt={userProfile.telegramUsername} data-ai-hint="profile picture" />
          <AvatarFallback>{userProfile.telegramUsername.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-semibold">@{userProfile.telegramUsername}</p>
        </div>
      </header>

      <div className="text-center">
          <p className="text-xl font-medium text-muted-foreground">Main Balance</p>
          <p className="text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            {mainBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pending Balance</CardTitle>
                <div className="text-xs text-amber-500 flex items-center">
                    <Hourglass className="mr-2 animate-spin h-4 w-4" />
                    {formatCountdown(countdown)}
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    {pendingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </p>
                <p className="text-xs text-muted-foreground">Crediting to main balance at the top of the hour.</p>
            </CardContent>
         </Card>
         <Card className={cn(isLicenseActive && "bg-green-500/20 border-green-500/50 relative overflow-hidden")}>
            {isLicenseActive && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-400/30 to-transparent opacity-50"></div>}
            <CardHeader>
                <CardTitle>Mining License</CardTitle>
            </CardHeader>
            <CardContent>
                {isLicenseActive ? (
                    <div className='flex flex-col items-center justify-center h-full text-center'>
                         <div className="p-3 mb-2 rounded-full bg-white/20">
                            <ShieldCheck className="w-10 h-10 text-white" />
                        </div>
                        <p className="font-semibold text-white">License Active</p>
                        <p className="text-xs text-white/80">(1x Earning Unlocked)</p>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground mb-4">
                            Activate your license to start mining MOO.
                        </p>
                        <Button className="w-full" onClick={handleLicenseActivation}>
                            Activate for 150 <Star className="ml-2 fill-yellow-400 text-yellow-500" />
                        </Button>
                    </>
                )}
            </CardContent>
         </Card>
      </div>

        <Card>
        <CardHeader>
            <CardTitle>Boost Chat Earning</CardTitle>
            <CardDescription>
                Increase your earning speed per message in group chats.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {hasPurchasedBoosts && (
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-sm font-semibold">Active boosts:</span>
                    {activatedBoosts.map(boostId => (
                        <Badge key={boostId} variant="secondary">{boostId} Boost</Badge>
                    ))}
                </div>
            )}
            <Dialog>
                <DialogTrigger asChild>
                    <Button className="w-full" variant={"default"} disabled={!isLicenseActive}>
                        <Rocket className="mr-2" /> 
                        {hasPurchasedBoosts ? "Purchase More Boosts" : "Boost Earning"}
                    </Button>
                </DialogTrigger>
                <DialogContent className="glass-card">
                    <DialogHeader>
                    <DialogTitle>Boost Your Chat Earning</DialogTitle>
                    <DialogDescription>
                        Select a boost to purchase and increase your earning speed per message. Purchased boosts are permanent.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-4 py-4">
                        {boosts.map((boost) => {
                            const isActivated = activatedBoosts.includes(boost.id);
                            return (
                            <Button
                                key={boost.id}
                                variant="default"
                                className="w-full justify-between"
                                disabled={isActivated}
                                onClick={() => handleBoostPurchase(boost.id)}
                            >
                                {isActivated ? (
                                <span className='text-left'>Activated</span>
                                ) : (
                                <>
                                    <div className='text-left'>
                                        <p>{boost.multiplier}x Boost</p>
                                        <p className="text-xs text-primary-foreground/80">{boost.description}</p>
                                    </div>
                                    <span className='flex items-center'>
                                        {boost.cost}{' '}
                                        <Star className="inline-block ml-1 fill-yellow-400 text-yellow-500" />
                                    </span>
                                </>
                                )}
                            </Button>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>
        </CardContent>
        </Card>


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
