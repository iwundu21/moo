
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
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, ShieldCheck, Rocket, UserPlus, XCircle, Ban, Info, Loader2 } from 'lucide-react';
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

const isValidTonAddress = (address: string) => {
  // Basic validation: 48 characters, starts with E or U, base64 characters.
  // This is not a foolproof cryptographic check but covers most user input errors.
  const tonAddressRegex = /^(EQ|UQ)[A-Za-z0-9\-_]{46}$/;
  return tonAddressRegex.test(address);
};

export default function AirdropPage() {
  const { userProfile, referrals, addClaimRecord, updateUserProfile, isAirdropLive } = useTelegram();
  const [mainBalance, setMainBalance] = useState(0);
  const [walletAddress, setWalletAddress] = useState('');
  const [claimedAmount, setClaimedAmount] = useState(0);
  const { toast } = useToast();
  const [eligibilityCriteria, setEligibilityCriteria] = useState<EligibilityCriterion[]>([]);
  const [isEligible, setIsEligible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setMainBalance(userProfile.mainBalance);
      if (userProfile.hasClaimedAirdrop) {
          setClaimedAmount(userProfile.mainBalance);
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
          link: '/'
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

  const handleInitialClaimClick = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsDialogOpen(true);
    }, 4000);
  };

  const handleSubmitClaim = () => {
    if (!walletAddress.trim()) {
        toast({
            title: "Error",
            description: "Please enter your wallet address.",
            variant: "destructive",
        });
        return;
    }
    
    if (!isValidTonAddress(walletAddress.trim())) {
        toast({
            title: "Invalid Address",
            description: "Please enter a valid TON wallet address.",
            variant: "destructive",
        });
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
          walletAddress: walletAddress
      });

      setMainBalance(0);
      setIsSubmitting(false);
      setIsDialogOpen(false);
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
            <p className="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent break-words">
                {mainBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                <span className="text-base ml-1">MOO</span>
            </p>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                <Button size="sm" disabled={mainBalance === 0 || !isEligible || !isAirdropLive || isProcessing} onClick={handleInitialClaimClick}>
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
  
  return (
    <div className="container mx-auto p-4 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-xl font-bold tracking-tight">Airdrop</h1>
      </header>
      
      <div className="space-y-4 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-base font-semibold leading-none tracking-tight">Your Main Balance</h2>
          {renderAirdropStatus()}
      </div>
      
      {!userProfile.hasClaimedAirdrop && (
        !isAirdropLive ? (
            <Alert variant="destructive">
                <Ban className="h-4 w-4" />
                <AlertTitle>Airdrop Claim Coming Soon</AlertTitle>
                <AlertDescription className="text-xs">
                    The airdrop is not yet live. Please check back for updates on when you can claim your allocation.
                </AlertDescription>
            </Alert>
        ) : (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Airdrop Claim is Live!</AlertTitle>
                <AlertDescription className="text-xs">
                    Claim your MOO airdrop allocation by submitting your TON wallet address. Ensure you meet all eligibility requirements first.
                </AlertDescription>
            </Alert>
        )
      )}


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

    </div>
  );
}
