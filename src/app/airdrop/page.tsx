
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, ShieldCheck, Rocket, UserPlus, XCircle, Ban, Info, Loader2, Clock } from 'lucide-react';
import { useTelegram } from '@/hooks/use-telegram';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type EligibilityCriterion = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  isCompleted: boolean;
  link?: string;
};

type DialogInfo = {
  title: string;
  description: string;
  status: 'success' | 'error';
};

const isValidTonAddress = (address: string) => {
  // Basic validation: 48 characters, starts with E or U, base64 characters.
  // This is not a foolproof cryptographic check but covers most user input errors.
  const tonAddressRegex = /^(EQ|UQ)[A-Za-z0-9\-_]{46}$/;
  return tonAddressRegex.test(address);
};

export default function AirdropPage() {
  const { userProfile, referrals, addClaimRecord, updateUserProfile, appSettings, isAirdropClaimable } = useTelegram();
  const [mainBalance, setMainBalance] = useState(0);
  const [walletAddress, setWalletAddress] = useState('');
  const [claimedAmount, setClaimedAmount] = useState(0);
  const [eligibilityCriteria, setEligibilityCriteria] = useState<EligibilityCriterion[]>([]);
  const [isEligible, setIsEligible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<DialogInfo | null>(null);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (userProfile) {
      setMainBalance(userProfile.mainBalance);
      // If the user has a claimed amount stored, use that as the source of truth for display.
      if (userProfile.airdropClaimedAmount && userProfile.airdropClaimedAmount > 0) {
        setClaimedAmount(userProfile.airdropClaimedAmount);
      }

      const criteria: EligibilityCriterion[] = [
        {
          id: 'license',
          title: 'Activate Mining License',
          description: 'Required to start earning.',
          icon: ShieldCheck,
          isCompleted: userProfile.isLicenseActive,
          link: '/'
        },
        {
          id: 'boost',
          title: 'Purchase 2x Boost',
          description: 'Boost your earning potential.',
          icon: Rocket,
          isCompleted: userProfile.purchasedBoosts.includes('2x'),
          link: '/referrals'
        },
        {
          id: 'referral',
          title: 'Refer a Friend',
          description: 'Invite at least one friend.',
          icon: UserPlus,
          isCompleted: referrals.length > 0,
          link: '/referrals'
        },
      ];

      setEligibilityCriteria(criteria);
      setIsEligible(criteria.every(c => c.isCompleted));
    }
  }, [userProfile, referrals]);
  
  useEffect(() => {
    if (!appSettings.airdropEndDate) {
        setTimeLeft("");
        return;
    }

    const intervalId = setInterval(() => {
        const now = new Date().getTime();
        const distance = appSettings.airdropEndDate!.getTime() - now;

        if (distance < 0) {
            setTimeLeft("Ended");
            clearInterval(intervalId);
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [appSettings.airdropEndDate]);

  const handleInitialClaimClick = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsClaimDialogOpen(true);
    }, 4000);
  };

  const handleSubmitClaim = () => {
    if (!walletAddress.trim()) {
        setDialogContent({ title: "Error", description: "Please enter your wallet address.", status: 'error' });
        setIsInfoDialogOpen(true);
        return;
    }
    
    if (!isValidTonAddress(walletAddress.trim())) {
        setDialogContent({ title: "Invalid Address", description: "Please enter a valid TON wallet address.", status: 'error' });
        setIsInfoDialogOpen(true);
        return;
    }

    if (!userProfile) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const amountToClaim = mainBalance;
      setClaimedAmount(amountToClaim);
      
      addClaimRecord({
          userId: userProfile.id,
          username: userProfile.telegramUsername,
          walletAddress: walletAddress,
          amount: amountToClaim,
          profilePictureUrl: userProfile.profilePictureUrl,
          timestamp: new Date(),
          status: 'processing'
      });
      
      updateUserProfile({ 
          mainBalance: 0, 
          hasClaimedAirdrop: true, 
          airdropStatus: 'processing',
          walletAddress: walletAddress,
          airdropClaimedAmount: amountToClaim,
      });

      setMainBalance(0);
      setIsSubmitting(false);
      setIsClaimDialogOpen(false);
    }, 4000);
  };

  if (!userProfile) {
    return null; // Or a loading spinner
  }
  
  const renderAirdropStatus = () => {
    if (userProfile.airdropStatus === 'distributed') {
      return (
        <Alert variant="default" className="border-green-500/50 bg-green-500/10 text-green-500">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Airdrop Distributed!</AlertTitle>
            <AlertDescription className="text-xs text-green-500/80">
                Your airdrop of <span className="font-bold">{claimedAmount.toLocaleString()} MOO</span> has been sent to your wallet.
                <p className="font-mono text-xs truncate pt-2">{userProfile.walletAddress}</p>
                <Button asChild variant="link" size="sm" className="p-0 h-auto text-green-500">
                  <a href={`https://tonscan.org/address/${userProfile.walletAddress}`} target="_blank" rel="noopener noreferrer">
                    View on TON Explorer
                  </a>
                </Button>
            </AlertDescription>
        </Alert>
      )
    }

    if (userProfile.hasClaimedAirdrop) {
       return (
            <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Claim Submitted for Processing</AlertTitle>
                <AlertDescription className="text-xs">
                    Your request to claim your airdrop allocation has been received. The transfer to your wallet is now being processed. You can monitor the status using your wallet provider.
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent break-all">
                {mainBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                <span className="text-base ml-1">MOO</span>
            </p>
             <Dialog open={isClaimDialogOpen} onOpenChange={setIsClaimDialogOpen}>
                <DialogTrigger asChild>
                <Button size="sm" disabled={mainBalance === 0 || !isEligible || !isAirdropClaimable || isProcessing} onClick={handleInitialClaimClick}>
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                       "Claim"
                    )}
                </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Claim Your Allocation</DialogTitle>
                    <DialogDescription>
                     You are about to claim <span className="font-bold text-primary">{mainBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} MOO</span>. Enter your TON network wallet address to receive your allocation.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="wallet-address" className="text-right">
                        Address
                    </Label>
                    <Input
                        id="wallet-address"
                        placeholder="Paste your TON wallet address"
                        className="col-span-3"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                    />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSubmitClaim} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            "Submit"
                        )}
                    </Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
  }
  
  const renderInfoAlert = () => {
    if (userProfile.hasClaimedAirdrop) return null;
    
    // Highest priority: if airdrop is paused by admin
    if (!appSettings.isAirdropLive) {
        return (
            <Alert variant="destructive">
                <Ban className="h-4 w-4" />
                <AlertTitle>Airdrop Claim Coming Soon</AlertTitle>
                <AlertDescription className="text-xs">
                    The airdrop is not currently active. Please check back for updates on when you can claim your allocation.
                </AlertDescription>
            </Alert>
        )
    }

    // If live, check for end date
    if (appSettings.airdropEndDate) {
        if (new Date() > appSettings.airdropEndDate) {
            return (
                <Alert variant="destructive">
                    <Ban className="h-4 w-4" />
                    <AlertTitle>Airdrop Claim Period Ended</AlertTitle>
                    <AlertDescription className="text-xs">
                        The claim period for the airdrop has now closed. Please check back for future events.
                    </AlertDescription>
                </Alert>
            );
        } else {
            return (
                <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Airdrop Claim Ends In</AlertTitle>
                    <AlertDescription className="text-xs">
                       <span className="font-semibold text-base">{timeLeft}</span>
                    </AlertDescription>
                </Alert>
            );
        }
    }

    // Default message if airdrop is live and no end date is set
    return (
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Airdrop Claim is Live!</AlertTitle>
            <AlertDescription className="text-xs">
                Claim your MOO airdrop allocation by submitting your TON wallet address. Ensure you meet all eligibility requirements first.
            </AlertDescription>
        </Alert>
    );
  }
  
  return (
    <div className="container mx-auto p-4 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-xl font-bold tracking-tight">Airdrop</h1>
      </header>
      
      <div className="space-y-4 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-base font-semibold leading-none tracking-tight">Your Main Balance</h2>
          {renderAirdropStatus()}
      </div>
      
      {renderInfoAlert()}


      <div className="space-y-4">
        <div className='px-2'>
          <h2 className="text-base font-semibold leading-none tracking-tight">Airdrop Eligibility</h2>
          <p className="text-xs text-muted-foreground">Complete these tasks to be eligible for the upcoming moo airdrop.</p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {eligibilityCriteria.map((criterion) => (
                <Card key={criterion.id} className={cn("flex flex-col", criterion.isCompleted ? 'border-green-500/50 bg-green-500/10' : 'border-destructive/50 bg-destructive/10')}>
                     <CardHeader className="flex flex-row items-start justify-between pb-2">
                        <div className="flex items-center gap-3">
                           <div className={cn("p-2 rounded-lg", criterion.isCompleted ? 'bg-green-500/20' : 'bg-destructive/20')}>
                                <criterion.icon className={cn("w-6 h-6", criterion.isCompleted ? 'text-green-500' : 'text-destructive')} />
                            </div>
                            <CardTitle className="text-sm">{criterion.title}</CardTitle>
                        </div>
                        {criterion.isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                            <XCircle className="w-5 h-5 text-destructive" />
                        )}
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                      <p className="text-xs text-muted-foreground">{criterion.description}</p>
                      {!criterion.isCompleted && criterion.link && (
                          <Button asChild variant="link" size="sm" className="p-0 h-auto justify-start mt-2">
                            <Link href={criterion.link}>
                              Go to task
                            </Link>
                          </Button>
                      )}
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
      
       <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent>
          {dialogContent && (
            <>
              <DialogHeader>
                  <div className="flex flex-col items-center justify-center text-center p-6">
                      {dialogContent.status === 'success' ? (
                          <CheckCircle className="w-16 h-16 text-primary mb-4" />
                      ) : (
                          <XCircle className="w-16 h-16 text-destructive mb-4" />
                      )}
                      <DialogTitle className={cn("text-xl", dialogContent.status === 'success' ? 'text-primary' : 'text-destructive')}>
                        {dialogContent.title}
                      </DialogTitle>
                      <DialogDescription className="pt-2 text-center text-xs">
                          {dialogContent.description}
                      </DialogDescription>
                  </div>
              </DialogHeader>
              <DialogClose asChild>
                <Button className="w-full">
                    Continue
                </Button>
              </DialogClose>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

    

    
