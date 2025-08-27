
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockUser, mockDistributionHistory } from '@/lib/data';
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

export default function AirdropPage({}: {}) {
  const [isClient, setIsClient] = useState(false);
  const [mainBalance, setMainBalance] = useState(mockUser.mainBalance);
  const [walletAddress, setWalletAddress] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleClaim = () => {
    if (!walletAddress.trim()) {
        toast({
            title: "Error",
            description: "Please enter your wallet address.",
            variant: "destructive",
        });
        return;
    }

    const claimedAmount = mainBalance;
    // Here you would typically send the data to your backend
    console.log('Claiming', claimedAmount, 'to wallet', walletAddress);
    
    toast({
        title: "Processing Airdrop",
        description: `Your ${claimedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MOO airdrop is processing.`,
    });

    setMainBalance(0);
    mockUser.mainBalance = 0;
    setWalletAddress('');
  };


  if (!isClient) {
    return null;
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
              {mockDistributionHistory.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="font-medium">{record.timestamp.toLocaleDateString()}</div>
                    <div className="text-xs text-muted-foreground">{record.timestamp.toLocaleTimeString()}</div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
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
