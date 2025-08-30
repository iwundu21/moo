
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, Rocket, Twitter, Send, Users, CheckCircle, Loader2, PartyPopper, Ticket, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useTelegram } from '@/hooks/use-telegram';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Confetti from 'react-confetti';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { LoadingSkeleton } from '@/components/layout/LoadingSkeleton';

// This is now a client-side representation and doesn't handle payments.
const boosts = [
  { id: '2x', multiplier: 2, cost: 100, description: 'Earn 10 MOO per message' },
  { id: '5x', multiplier: 5, cost: 200, 'description': 'Earn 20 MOO per message' },
  { id: '10x', multiplier: 10, cost: 350, 'description': 'Earn 35 MOO per message' },
];

type TaskStatus = 'idle' | 'verifying' | 'completed';
type SocialTasks = {
    [key: string]: TaskStatus;
};

const initialTasks: SocialTasks = {
  twitter: 'idle',
  telegram: 'idle',
  community: 'idle',
  referral: 'idle'
};


export default function Home() {
  const { userProfile, updateUserProfile, redeemReferralCode, isLoading, claimPendingBalance } = useTelegram();
  const [mainBalance, setMainBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [activatedBoosts, setActivatedBoosts] = useState<string[]>([]);
  const [isLicenseActive, setIsLicenseActive] = useState(false);
  const [socialTasks, setSocialTasks] = useState<SocialTasks>(initialTasks);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showActivationSuccess, setShowActivationSuccess] = useState(false);
  const [openedTasks, setOpenedTasks] = useState<Set<string>>(new Set());
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [earningSpeed, setEarningSpeed] = useState(0);
  const { toast } = useToast();

  const socialTaskList = [
    { id: 'twitter', icon: Twitter, text: 'Follow on X', link: 'https://x.com/moo_cow_milk?t=3r4XYNXvnuRDf9eqhTjFqw&s=09' },
    { id: 'telegram', icon: Send, text: 'Subscribe Telegram', link: 'https://t.me/moo_officialanouncement' },
    { id: 'community', icon: Users, text: 'Join MOO Community', link: 'https://t.me/moo_chat_earn' },
  ];
  
  const allTasksCompleted = useMemo(() => {
    if (!userProfile) return false;
    const social = socialTaskList.every(task => socialTasks[task.id] === 'completed');
    const referral = socialTasks.referral === 'completed';
    return social && referral;
  }, [socialTasks, userProfile, socialTaskList]);


  useEffect(() => {
    if(userProfile) {
      setMainBalance(userProfile.mainBalance);
      setPendingBalance(userProfile.pendingBalance);
      setActivatedBoosts(userProfile.purchasedBoosts);
      setIsLicenseActive(userProfile.isLicenseActive);
      
      const initialSocialTasks: SocialTasks = {
        twitter: userProfile.completedSocialTasks?.twitter || 'idle',
        telegram: userProfile.completedSocialTasks?.telegram || 'idle',
        community: userProfile.completedSocialTasks?.community || 'idle',
        referral: userProfile.referredBy ? 'completed' : 'idle',
      };
      setSocialTasks(initialSocialTasks);
      
      // Calculate earning speed
      const tasksCompleted = Object.values(initialSocialTasks).every(status => status === 'completed');
      if (userProfile.isLicenseActive && tasksCompleted) {
        if (userProfile.purchasedBoosts?.includes("10x")) setEarningSpeed(35);
        else if (userProfile.purchasedBoosts?.includes("5x")) setEarningSpeed(20);
        else if (userProfile.purchasedBoosts?.includes("2x")) setEarningSpeed(10);
        else setEarningSpeed(5);
      } else {
        setEarningSpeed(0);
      }
    }
  }, [userProfile]);


  const handleBoostPurchase = async (boostId: string) => {
    if (activatedBoosts.includes(boostId) || !userProfile || !window.Telegram?.WebApp) return;

    const boost = boosts.find(b => b.id === boostId);
    if (!boost) return;

    // This is a placeholder for a payment flow.
    // In a real app, this would call a backend to create an invoice.
    toast({
        title: "Coming Soon!",
        description: "Purchasing boosts will be enabled shortly.",
    });

  };

  const handleLicenseActivation = async () => {
    if (isLicenseActive || !userProfile) return;
    
    const newBalance = (userProfile.mainBalance || 0) + 5000;
    
    await updateUserProfile({
        isLicenseActive: true,
        mainBalance: newBalance,
    });
    
    setMainBalance(newBalance);
    setIsLicenseActive(true);
    setShowConfetti(true);
    setShowActivationSuccess(true);
  }
  
  const handleClaimPendingBalance = async () => {
    if (!userProfile || userProfile.pendingBalance <= 0) return;
    
    setIsClaiming(true);
    const result = await claimPendingBalance();
    
    if (result.success) {
      setMainBalance(result.newMainBalance!);
      setPendingBalance(0);
      toast({
        title: "Success!",
        description: `You've claimed ${result.claimedAmount?.toLocaleString()} MOO.`,
      });
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
    setIsClaiming(false);
  };


  const handleTaskOpen = (taskId: string) => {
    setOpenedTasks(prev => new Set(prev).add(taskId));
  };

  const handleConfirmTask = (taskId: string) => {
    setSocialTasks(prev => ({...prev, [taskId]: 'verifying'}));

    setTimeout(() => {
        const newSocialTasks = {...socialTasks, [taskId]: 'completed'};
        setSocialTasks(newSocialTasks);
        updateUserProfile({ completedSocialTasks: newSocialTasks });
    }, 2000);
  }

   const handleRedeemCode = async () => {
      if (!referralCodeInput.trim()) {
          toast({
              title: "Error",
              description: "Please enter a referral code.",
              variant: "destructive",
          });
          return;
      }
      
      const result = await redeemReferralCode(referralCodeInput.trim().toUpperCase());

      toast({
          title: result.success ? "Success!" : "Error",
          description: result.message,
          variant: result.success ? "default" : "destructive",
      });

      if (result.success && userProfile) {
        setReferralCodeInput('');
        setSocialTasks(prev => ({...prev, referral: 'completed' }));
      }
    };
  
  const hasPurchasedBoosts = activatedBoosts.length > 0;
  
  const isReadyToEarn = isLicenseActive && allTasksCompleted;

  if (isLoading) {
    return <LoadingSkeleton />;
  }
  
  if (!userProfile) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center h-screen">
          <p className="text-destructive text-center">Could not load user profile. Please try again.</p>
      </div>
    );
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
          <p className="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent break-all">
            {mainBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            <span className="text-base ml-1">MOO</span>
          </p>
      </div>

      <div className="space-y-4 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between">
              <h3 className="text-xl font-semibold leading-none tracking-tight">Pending Balance</h3>
              <Button 
                size="sm"
                onClick={handleClaimPendingBalance}
                disabled={pendingBalance <= 0 || isClaiming}
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  "Claim"
                )}
              </Button>
          </div>
          <div>
              <p className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent break-all">
                  {pendingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  <span className="text-base ml-1">MOO</span>
              </p>
              <p className="text-xs text-muted-foreground">This balance is updated from your chat activity.</p>
          </div>
      </div>
      
      {!isLicenseActive && (
        <div className="space-y-4">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>How It Works</AlertTitle>
                <AlertDescription className="text-xs space-y-1">
                  <p>1. Activate your license to get 5,000 MOO and unlock earning tasks.</p>
                  <p>2. Complete social tasks & redeem a referral code.</p>
                  <p>3. Send messages in designated group chats to earn MOO.</p>
                </AlertDescription>
            </Alert>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <div className="flex-1">
                    <h3 className="text-xl font-semibold leading-none tracking-tight">Mining License</h3>
                    <p className="text-xs text-muted-foreground pt-1.5">
                        Activate your license to start mining MOO and get 5,000 MOO.
                    </p>
                </div>
                <div className="pt-4">
                    <Button className="w-full" onClick={handleLicenseActivation} disabled={isLicenseActive}>
                        <span className='flex items-center'>Activate License</span>
                    </Button>
                </div>
            </div>
        </div>
      )}

      {isLicenseActive && (
        <>
          <div className="space-y-4 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div>
                <h3 className="text-xl font-semibold leading-none tracking-tight">Social Tasks</h3>
                <p className="text-xs text-muted-foreground pt-1.5">
                    Complete tasks to unlock earning in the group chat.
                </p>
            </div>
            {!allTasksCompleted ? (
                <div className="space-y-4 pt-4">
                    {socialTaskList.map(task => {
                        const status = socialTasks[task.id];
                        const isOpened = openedTasks.has(task.id);
                        return (
                            <div key={task.id} className="space-y-2">
                                <Button asChild className="w-full justify-between" variant="outline" disabled={status !== 'idle'}>
                                    <Link href={task.link} target="_blank" onClick={() => handleTaskOpen(task.id)}>
                                        <span className="flex items-center gap-3">
                                            <task.icon />
                                            {task.text}
                                        </span>
                                        <Badge variant="secondary">
                                            Complete Task
                                        </Badge>
                                    </Link>
                                </Button>
                                {(isOpened || status !== 'idle') && (
                                    <Button 
                                        onClick={() => handleConfirmTask(task.id)}
                                        disabled={status !== 'idle'}
                                        className="w-full"
                                    >
                                        {status === 'idle' && <span className='flex items-center'>Confirm</span>}
                                        {status === 'verifying' && <Loader2 className="animate-spin" />}
                                        {status === 'completed' && <CheckCircle />}
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                    {socialTasks.referral !== 'completed' && (
                        <div className="space-y-3 pt-2">
                            <div className="space-y-2">
                                <Input
                                    id="referral-code-input"
                                    placeholder="Enter friend's referral code"
                                    value={referralCodeInput}
                                    onChange={(e) => setReferralCodeInput(e.target.value)}
                                    className="uppercase flex-1"
                                    disabled={socialTasks.referral === 'completed'}
                                />
                                 <Button onClick={handleRedeemCode} disabled={socialTasks.referral === 'completed'} className="w-full">
                                    <Ticket className="mr-2" />
                                    Redeem
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground px-1">Redeem a code to complete the task.</p>
                        </div>
                    )}
                </div>
            ) : (
                 <div className="text-center py-4 space-y-1">
                     <p className="text-sm text-green-500 font-semibold">You are now active to earn!</p>
                    <p className="text-xs text-muted-foreground">Start sending messages in designated group chats.</p>
                     {earningSpeed > 0 && (
                        <p className="text-xs text-muted-foreground">
                            Your current earning speed: <span className="font-bold text-primary">{earningSpeed} MOO</span> per message.
                        </p>
                    )}
                </div>
            )}
          </div>

          <div className="space-y-4 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
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
                        <Button className="w-full" variant={"default"} disabled={!isReadyToEarn}>
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
                                    className="h-auto w-full justify-between"
                                    disabled={isActivated}
                                    onClick={() => handleBoostPurchase(boost.id)}
                                >
                                    {isActivated ? (
                                    <span className='py-2 text-left'>Activated</span>
                                    ) : (
                                    <>
                                        <div className='py-2 text-left'>
                                            <p>{boost.multiplier}x Boost</p>
                                            <p className="text-xs text-primary-foreground/80">{boost.description}</p>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <Star className="w-4 h-4" />
                                            <span className="font-semibold">{boost.cost}</span>
                                        </div>
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
        </>
      )}

      <Dialog open={showActivationSuccess} onOpenChange={setShowActivationSuccess}>
        <DialogContent>
          <DialogHeader>
              <div className="flex flex-col items-center justify-center text-center p-6">
                  <PartyPopper className="w-16 h-16 text-yellow-500 mb-4" />
                  <DialogTitle className="text-xl">Congratulations! 🎊</DialogTitle>
                  <DialogDescription className="pt-2 text-center text-xs">
                      Your mining license is active and you've received 5,000 MOO! You can now complete social tasks and purchase boosts to supercharge your earnings.
                  </DialogDescription>
              </div>
          </DialogHeader>
          <Button className="w-full" onClick={() => setShowActivationSuccess(false)}>
              Continue
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    
