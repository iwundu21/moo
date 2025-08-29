
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Download, Trash2, Users, Gem, ShieldCheck, CheckCircle, Send } from 'lucide-react';
import { useTelegram } from '@/hooks/use-telegram';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useEffect, useState } from "react";
import { AirdropClaim } from "@/lib/types";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";


export default function AdminPage() {
  const { isAirdropLive, setAirdropStatus, clearAllClaims, totalMooGenerated, totalUserCount, totalLicensedUsers, updateClaimStatus, batchUpdateClaimStatuses, fetchAdminStats } = useTelegram();
  const [claimedAirdrops, setClaimedAirdrops] = useState<AirdropClaim[]>([]);
  
  useEffect(() => {
    fetchAdminStats();
    
    const fetchClaims = async () => {
      const claimsQuery = query(collection(db, 'airdropClaims'), orderBy('timestamp', 'desc'));
      const claimsSnapshot = await getDocs(claimsQuery);
      const claims = claimsSnapshot.docs.map(d => {
        const data = d.data();
        const timestamp = data.timestamp && typeof data.timestamp.toDate === 'function' 
            ? data.timestamp.toDate() 
            : new Date(); // Fallback
        return { ...data, timestamp } as AirdropClaim
      });
      
      setClaimedAirdrops(claims);
    };
    
    fetchClaims().catch(console.error);
    
  }, [fetchAdminStats]);


  const downloadCSV = () => {
    if (claimedAirdrops.length === 0) return;

    const headers = ['User ID', 'Username', 'Wallet Address', 'Amount', 'Timestamp', 'Status'];
    const csvContent = [
      headers.join(','),
      ...claimedAirdrops.map(claim => 
        [claim.userId, claim.username, claim.walletAddress, claim.amount, claim.timestamp.toISOString(), claim.status].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'airdrop_claims.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleClearClaims = async () => {
    await clearAllClaims();
    setClaimedAirdrops([]);
  };

  const handleDistribute = async (userId: string, walletAddress: string, amount: number) => {
    await updateClaimStatus(userId, 'distributed', walletAddress, amount);
    // Refresh the claims list to show the updated status
    setClaimedAirdrops(prevClaims => 
      prevClaims.map(claim => 
        claim.userId === userId ? { ...claim, status: 'distributed' } : claim
      )
    );
  };

  const handleDistributeAll = async () => {
    const pendingClaims = claimedAirdrops.filter(claim => claim.status === 'processing');
    if (pendingClaims.length === 0) return;

    await batchUpdateClaimStatuses(pendingClaims);

    setClaimedAirdrops(prevClaims =>
      prevClaims.map(claim => 
        pendingClaims.some(p => p.userId === claim.userId) 
        ? { ...claim, status: 'distributed' } 
        : claim
      )
    );
  };

  const pendingClaimsCount = claimedAirdrops.filter(c => c.status === 'processing').length;


  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <header className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground">Manage airdrop claims and settings</p>
        </header>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-2">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/20 text-primary">
                    <Users className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                    <p className="text-lg font-bold">{totalUserCount.toLocaleString()}</p>
                </div>
            </div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-2">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/20 text-primary">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Licensed Miners</p>
                    <p className="text-lg font-bold">{totalLicensedUsers.toLocaleString()}</p>
                </div>
            </div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-2">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/20 text-primary">
                    <Gem className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Total MOO Generated</p>
                    <p className="text-lg font-bold">{totalMooGenerated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold">Airdrop Control</h3>
                    <p className="text-xs text-muted-foreground">Enable or disable claims for all users.</p>
                </div>
                 <Switch
                    id="airdrop-status"
                    checked={isAirdropLive}
                    onCheckedChange={setAirdropStatus}
                />
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current Status:</span>
                <Badge variant={isAirdropLive ? "default" : "destructive"}>
                    {isAirdropLive ? "Live" : "Paused"}
                </Badge>
            </div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
           <div>
                <h3 className="text-base font-semibold">Data Management</h3>
                <p className="text-xs text-muted-foreground">Download or clear claim data.</p>
            </div>
            <div className="flex gap-4">
                <Button onClick={downloadCSV} disabled={claimedAirdrops.length === 0} className="w-full">
                    <Download className="mr-2" />
                    Download CSV
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={claimedAirdrops.length === 0} className="w-full">
                        <Trash2 className="mr-2" />
                        Clear Claims
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all
                        airdrop claim submissions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearClaims}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6 flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold">Claim Submissions ({claimedAirdrops.length})</h3>
              <p className="text-xs text-muted-foreground">{pendingClaimsCount} pending</p>
            </div>
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={pendingClaimsCount === 0}>
                  <Send className="mr-2" />
                  Distribute All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Distribute all pending claims?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark all {pendingClaimsCount} pending claims as 'distributed' and update the user profiles. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDistributeAll}>Confirm & Distribute</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Wallet Address</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claimedAirdrops.length > 0 ? (
              claimedAirdrops.map((claim) => (
                <TableRow key={claim.userId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={claim.profilePictureUrl} data-ai-hint="profile picture" />
                            <AvatarFallback>{claim.username.substring(0, 1)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-xs">@{claim.username}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{claim.walletAddress}</TableCell>
                  <TableCell className="font-semibold text-xs">
                    {claim.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} MOO
                  </TableCell>
                  <TableCell className="text-right">
                    {claim.status === 'distributed' ? (
                       <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Distributed
                        </Badge>
                    ) : (
                        <Button size="sm" onClick={() => handleDistribute(claim.userId, claim.walletAddress, claim.amount)}>
                            Distribute
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No claims submitted yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
