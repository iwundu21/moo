
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { CheckCircle } from 'lucide-react';
import { useTelegram } from '@/hooks/use-telegram';

export default function AirdropPage() {
  const { userProfile, distributionHistory } = useTelegram();
  const [mainBalance, setMainBalance] = useState(0);
  const [walletAddress, setWalletAddress] = useState('');
  const [isClaimed, setIsClaimed] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile) {
      setMainBalance(userProfile.mainBalance);
      // If balance is 0, it means it has been claimed.
      if (userProfile.mainBalance === 0) {
          setIsClaimed(true);
      }
    }
  }, [userProfile]);

  const handleClaim = () => {
    if (!walletAddress.trim()) {
        toast({
            title: "Error",
            description: "Please enter your wallet address.",
            variant: "destructive",
        });
        return;
    }

    const amountToClaim = mainBalance;
    setClaimedAmount(amountToClaim);
    // Here you would typically send the data to your backend
    console.log('Claiming', amountToClaim, 'to wallet', walletAddress);
    
    setMainBalance(0);
    if(userProfile) userProfile.mainBalance = 0;
    setWalletAddress('');
    setIsClaimed(true);
  };


  if (!userProfile) {
    return null; // Or a loading spinner
  }
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Airdrop</h1>
      </header>
      
      <Card>
          <CardHeader>
              <CardTitle>Your Main Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {isClaimed ? (
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Processing Airdrop</AlertTitle>
                    <AlertDescription>
                        Your MOO airdrop is processing. You can check the status in your wallet.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="flex items-center justify-between">
                <p className="text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    {mainBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <Dialog>
                    <DialogTrigger asChild>
                    <Button disabled={mainBalance === 0}>Claim</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] glass-card">
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
                </div>
            )}
          </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribution History</CardTitle>
          <CardDescription>Record of hourly pending balance credits.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distributionHistory.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="font-medium">{record.timestamp.toLocaleDateString()}</div>
                    <div className="text-xs text-muted-foreground">{record.timestamp.toLocaleTimeString()}</div>
                  </TableCell>
                  <TableCell className="text-right font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    + {record.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
