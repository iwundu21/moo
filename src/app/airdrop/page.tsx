
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
import { CheckCircle, ShieldCheck, Rocket, UserPlus, Gem, XCircle, Zap, Ban } from 'lucide-react';
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

export default function AirdropPage() {
  const { userProfile, referrals, addClaimRecord, updateUserProfile, isAirdropLive } = useTelegram();
  const [mainBalance, setMainBalance] = useState(0);
  const [walletAddress, setWalletAddress] = useState('');
  const [isClaimed, setIsClaimed] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState(0);
  const { toast } = useToast();
  const [eligibilityCriteria, setEligibilityCriteria] = useState<EligibilityCriterion[]>([]);
  const [isEligible, setIsEligible] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setMainBalance(userProfile.mainBalance);
      // Check if this user has already claimed by checking if balance is 0
      if (userProfile.hasClaimedAirdrop) {
          setIsClaimed(true);
          setClaimedAmount(userProfile.mainBalance); // Assuming last balance was the claimed amount
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
  }, [userProfile, referrals, isAirdropLive]);

  const handleClaim = () => {
    if (!walletAddress.trim()) {
        toast({
            title: "Error",
            description: "Please enter your wallet address.",
            variant: "destructive",
        });
        return;
    }
    if (!userProfile) return;

    const amountToClaim = mainBalance;
    setClaimedAmount(amountToClaim);
    
    // Save claim data
    addClaimRecord({
        username: userProfile.telegramUsername,
        walletAddress: walletAddress,
        amount: amountToClaim,
    });
    
    // Update user profile to reflect claim
    updateUserProfile({ mainBalance: 0, hasClaimedAirdrop: true });

    setMainBalance(0);
    setWalletAddress('');
    setIsClaimed(true);
  };


  if (!userProfile) {
    return null; // Or a loading spinner
  }
  
  return (
    <div className="container mx-auto p-4 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-xl font-bold tracking-tight">Airdrop</h1>
      </header>
      
      <div className="space-y-4 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-base font-semibold leading-none tracking-tight">Your Main Balance</h2>
          
        {isClaimed ? (
            <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Claim Submitted for Processing</AlertTitle>
                <AlertDescription className="text-xs">
                    Your request to claim your airdrop allocation has been received. The transfer to your wallet is now being processed. You can monitor the status using your wallet provider.
                </AlertDescription>
            </Alert>
        ) : (
            <div className="flex items-center justify-between">
                <p className="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    {mainBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </p>
                {isAirdropLive ? (
                     <Dialog>
                        <DialogTrigger asChild>
                        <Button size="sm" disabled={mainBalance === 0 || !isEligible}>Claim</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Claim Your Allocation</DialogTitle>
                            <DialogDescription>
                            Enter your TON network wallet address to receive your MOO.
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
                            <DialogClose asChild>
                                <Button type="submit" onClick={handleClaim}>Claim Your Allocation</Button>
                            </DialogClose>
                        </DialogFooter>
                        </DialogContent>
                    </Dialog>
                ) : (
                    <Button size="sm" disabled>Claim</Button>
                )}
            </div>
        )}
        {!isClaimed && (
             <Alert variant={isAirdropLive ? "default" : "destructive"} className={cn(
                isAirdropLive ? "border-green-500/50 bg-green-500/10 text-green-200" : "border-amber-500/50 bg-amber-500/10 text-amber-200"
             )}>
                {isAirdropLive ? <Zap className="h-4 w-4 text-green-500" /> : <Ban className="h-4 w-4 text-amber-500" />}
                <AlertTitle className={cn(isAirdropLive ? "text-green-400" : "text-amber-400")}>
                    {isAirdropLive ? 'Airdrop Claim is Live!' : 'Claiming Coming Soon'}
                </AlertTitle>
                <AlertDescription className="text-xs">
                    {isAirdropLive ? 'Complete the eligibility tasks and claim your MOO tokens.' : 'The airdrop claim period has not started yet. Please check back later.'}
                </AlertDescription>
            </Alert>
        )}
      </div>

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
