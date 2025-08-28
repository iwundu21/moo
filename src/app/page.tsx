
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, Hourglass, Rocket, Twitter, Send, Users, CheckCircle, Loader2, PartyPopper, Zap } from 'lucide-react';
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
import Link from 'next/link';
import Confetti from 'react-confetti';
import { createPayment } from '@/ai/flows/payment-flow';


const boosts = [
  { id: '2x', multiplier: 2, cost: 100, description: 'Earn 10 MOO per message', price: 1.00 },
  { id: '5x', multiplier: 5, cost: 200, 'description': 'Earn 25 MOO per message', price: 2.00 },
  { id: '10x', multiplier: 10, cost: 350, 'description': 'Earn 50 MOO per message', price: 3.50 },
];

type TaskStatus = 'idle' | 'verifying' | 'completed';
type SocialTasks = {
    [key: string]: TaskStatus;
};

const initialTasks: SocialTasks = {
  twitter: 'idle',
  telegram: 'idle',
  community: 'idle',
};


export default function Home() {
  const { userProfile, addDistributionRecord, updateUserProfile } = useTelegram();
  const [mainBalance, setMainBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [activatedBoosts, setActivatedBoosts] = useState<string[]>([]);
  const [isLicenseActive, setIsLicenseActive] = useState(false);
  const [socialTasks, setSocialTasks] = useState<SocialTasks>(initialTasks);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showActivationSuccess, setShowActivationSuccess] = useState(false);
  const [openedTasks, setOpenedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if(userProfile) {
      setMainBalance(userProfile.mainBalance);
      setPendingBalance(userProfile.pendingBalance);
      setActivatedBoosts(userProfile.purchasedBoosts);
      setIsLicenseActive(userProfile.isLicenseActive);
      setSocialTasks(userProfile.completedSocialTasks || initialTasks);
    }
  }, [userProfile]);

  useEffect(() => {
    if (!userProfile || !isLicenseActive || activatedBoosts.length === 0) return;

    let earnRate = 0; // Base rate is 0, must purchase a boost to earn

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
        
        const newMainBalance = mainBalance + amountToCredit;
        setMainBalance(newMainBalance);
        setPendingBalance(0);

        updateUserProfile({ 
            mainBalance: newMainBalance, 
            pendingBalance: 0 
        });

        addDistributionRecord({
          timestamp: new Date(),
          amount: amountToCredit,
        });
      }
    };

    updateCountdown(); // Initial call
    const countdownInterval = setInterval(updateCountdown, 1000);

    return () => clearInterval(countdownInterval);
  }, [userProfile, pendingBalance, addDistributionRecord, updateUserProfile, mainBalance]);

  const handleBoostPurchase = async (boostId: string) => {
    if (activatedBoosts.includes(boostId)) return;

    const boost = boosts.find(b => b.id === boostId);
    if (!boost || !userProfile) return;

    try {
      const invoiceLink = await createPayment({
        userId: userProfile.id,
        boostId: boost.id,
        price: boost.cost // Use `cost` for the price in Stars
      });

      if (invoiceLink && window.Telegram?.WebApp) {
        window.Telegram.WebApp.openInvoice(invoiceLink, (status) => {
          if (status === 'paid') {
            const newBoosts = [...activatedBoosts, boostId];
            setActivatedBoosts(newBoosts);
            updateUserProfile({ purchasedBoosts: newBoosts });
            window.Telegram.WebApp.close();
          }
        });
      }
    } catch (error) {
      console.error("Payment creation failed:", error);
    }
  };

  const handleLicenseActivation = () => {
    if (isLicenseActive) return;
    const cost = 150;
    if (mainBalance >= cost) {
        const newMainBalance = mainBalance - cost;
        setMainBalance(newMainBalance);
        setIsLicenseActive(true);
        updateUserProfile({ isLicenseActive: true, mainBalance: newMainBalance });
        setShowConfetti(true);
        setShowActivationSuccess(true);
    } else {
        // Optionally, show a toast or message that they don't have enough balance
        console.log("Not enough balance to activate license.");
    }
  }

  const handleTaskOpen = (taskId: string) => {
    setOpenedTasks(prev => new Set(prev).add(taskId));
  };

  const handleConfirmTask = (taskId: string) => {
    setSocialTasks(prev => ({...prev, [taskId]: 'verifying'}));

    setTimeout(() => {
        const newMainBalance = mainBalance + 100;
        const newSocialTasks = {...socialTasks, [taskId]: 'completed'};
        setMainBalance(newMainBalance);
        setSocialTasks(newSocialTasks);
        updateUserProfile({ mainBalance: newMainBalance, completedSocialTasks: newSocialTasks });
    }, 6000); // 6 seconds
  }

  const socialTaskList = [
    { id: 'twitter', icon: Twitter, text: 'Follow on X', link: 'https://x.com/your-profile', reward: 100 },
    { id: 'telegram', icon: Send, text: 'Subscribe Telegram', link: 'https://t.me/your-channel', reward: 100 },
    { id: 'community', icon: Users, text: 'Join MOO Community', link: 'https://t.me/your-community', reward: 100 },
  ];
  
  const formatCountdown = (seconds: number | null) => {
    if (seconds === null) return '00:00:00';
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const hasPurchasedBoosts = activatedBoosts.length > 0;
  
  const allTasksCompleted = useMemo(() => Object.values(socialTasks).every(s => s === 'completed'), [socialTasks]);

  if (!userProfile) {
    return null; // Or a loading spinner
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      {showConfetti && <Confetti recycle={false} onConfettiComplete={() => setShowConfetti(false)} />}
      <header className="flex items-center space-x-4 pt-4">
        <Avatar className="w-16 h-16 border-2 border-primary">
          <AvatarImage src={userProfile.profilePictureUrl} alt={userProfile.telegramUsername} data-ai-hint="profile picture" />
          <AvatarFallback>{userProfile.telegramUsername.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-base font-semibold">@{userProfile.telegramUsername}</p>
        </div>
      </header>

      <div className="text-center space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Main Balance</p>
          <p className="text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            {mainBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} MOO
          </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="space-y-4 rounded-lg p-6">
            <div className="flex flex-row items-center justify-between">
                <h3 className="text-xl font-semibold leading-none tracking-tight">Pending Balance</h3>
                <div className="text-xs text-amber-500 flex items-center">
                    <Hourglass className="mr-2 animate-spin h-4 w-4" />
                    {formatCountdown(countdown)}
                </div>
            </div>
            <div>
                <p className="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    {pendingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} MOO
                </p>
                <p className="text-xs text-muted-foreground">Crediting to main balance at the top of the hour.</p>
            </div>
         </div>
         <div className="space-y-4 rounded-lg p-6">
            {isLicenseActive ? (
                !allTasksCompleted ? (
                    <div>
                        <h3 className="text-xl font-semibold leading-none tracking-tight">Social Tasks</h3>
                        <p className="text-xs text-muted-foreground pt-1.5">
                            Complete tasks to earn more rewards.
                        </p>
                        <div className="space-y-3 pt-4">
                            {socialTaskList.map(task => {
                                const status = socialTasks[task.id];
                                const isOpened = openedTasks.has(task.id);
                                return (
                                    <div key={task.id} className="flex items-center gap-2">
                                        <Button asChild className="flex-1 justify-start" variant="outline" disabled={status !== 'idle'}>
                                            <Link href={task.link} target="_blank" onClick={() => handleTaskOpen(task.id)}>
                                                <task.icon className="mr-3" />
                                                <span className="flex-1 text-left">{task.text}</span>
                                                 <Badge variant="secondary">
                                                    +{task.reward} MOO
                                                 </Badge>
                                            </Link>
                                        </Button>
                                        {(isOpened || status !== 'idle') && (
                                            <Button 
                                                onClick={() => handleConfirmTask(task.id)}
                                                disabled={status !== 'idle'}
                                                className="w-28"
                                            >
                                                {status === 'idle' && (
                                                    <span className='flex items-center'>
                                                        Confirm
                                                    </span>
                                                )}
                                                {status === 'verifying' && <Loader2 className="animate-spin" />}
                                                {status === 'completed' && <CheckCircle />}
                                            </Button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : null
            ) : (
                <div className="flex flex-col items-center justify-center text-center h-full">
                    <h3 className="text-xl font-semibold leading-none tracking-tight">Mining License</h3>
                    <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-4">
                            Activate your license to start mining MOO.
                        </p>
                        <Button className="w-full" onClick={handleLicenseActivation} disabled={mainBalance < 150}>
                            Activate for 150 MOO <Star className="ml-2 fill-yellow-400 text-yellow-500" />
                        </Button>
                    </div>
                </div>
            )}
         </div>
      </div>

      <Dialog open={showActivationSuccess} onOpenChange={setShowActivationSuccess}>
        <DialogContent>
          <DialogHeader>
              <div className="flex flex-col items-center justify-center text-center p-6">
                  <PartyPopper className="w-16 h-16 text-yellow-500 mb-4" />
                  <DialogTitle className="text-xl">Congratulations! 🎊</DialogTitle>
                  <DialogDescription className="pt-2 text-center text-xs">
                      Your mining license is active! You can now earn rewards by sending messages in group chats. Complete one final step to supercharge your earnings.
                  </DialogDescription>
              </div>
          </DialogHeader>
          <Button className="w-full" onClick={() => setShowActivationSuccess(false)}>
              Continue
          </Button>
        </DialogContent>
      </Dialog>

      <div className="space-y-4 rounded-lg p-6">
        <div>
            <h3 className="text-xl font-semibold leading-none tracking-tight">Boost Chat Earning</h3>
            <p className="text-xs text-muted-foreground pt-1.5">
                Increase your earning speed per message in group chats.
            </p>
        </div>
        <div className="pt-2">
            {hasPurchasedBoosts && (
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs font-semibold">Active boosts:</span>
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
                <DialogContent>
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
                                        {boost.cost} <Zap className="ml-2 w-4 h-4 text-yellow-400" />
                                    </span>
                                </>
                                )}
                            </Button>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
      </div>

    </div>
  );
}
    
