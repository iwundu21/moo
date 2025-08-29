
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
import { Download, Trash2, Users, Gem, ShieldCheck, CheckCircle, Send, Ban, Zap } from 'lucide-react';
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
import { useEffect, useState, useCallback, useMemo } from "react";
import type { AirdropClaim } from "@/lib/types";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";


export default function AdminPage() {
  const { isAirdropLive, setAirdropStatus, clearAllClaims, totalMooGenerated, totalUserCount, totalLicensedUsers, updateClaimStatus, batchUpdateClaimStatuses, fetchAdminStats, deleteUser, distributePendingBalances } = useTelegram();
  const [claims, setClaims] = useState<AirdropClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const claimsQuery = query(collection(db, 'airdropClaims'), orderBy('timestamp', 'desc'));
      
      const claimsSnapshot = await getDocs(claimsQuery);
      
      const claimsData = claimsSnapshot.docs.map(d => {
        const data = d.data();
        const timestamp = data.timestamp && typeof data.timestamp.toDate === 'function' 
            ? data.timestamp.toDate() 
            : new Date(); // Fallback
        return { ...data, timestamp } as AirdropClaim
      });
      setClaims(claimsData);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminStats();
    fetchAllData();
  }, [fetchAdminStats, fetchAllData]);

  const downloadCSV = () => {
    if (claims.length === 0) return;

    const headers = ['User ID', 'Username', 'Wallet Address', 'Claim Amount', 'Claim Status'];
    const csvContent = [
      headers.join(','),
      ...claims.map(claim => 
        [claim.userId, claim.username, claim.walletAddress, claim.amount, claim.status || 'N/A'].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'claims.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleClearClaims = async () => {
    await clearAllClaims();
    setClaims([]);
  };

  const handleDistribute = async (userId: string, walletAddress: string, amount: number) => {
    if (!walletAddress || amount <= 0) return;
    await updateClaimStatus(userId, 'distributed', walletAddress, amount);
    await fetchAllData();
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteUser(userId);
    setClaims(prevClaims => prevClaims.filter(claim => claim.userId !== userId));
    fetchAdminStats();
  };

  const handleDistributeAll = async () => {
    const pendingClaims = claims.filter(claim => claim.status === 'processing');
    if (pendingClaims.length === 0) return;

    await batchUpdateClaimStatuses(pendingClaims);

    await fetchAllData();
  };
  
  const handleDistributePending = async () => {
    await distributePendingBalances();
    // Optionally, refresh data to reflect changes
    fetchAdminStats();
    // Maybe show a toast notification
  };


  const pendingClaimsCount = claims.filter(c => c.status === 'processing').length;

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
                <Button onClick={downloadCSV} disabled={claims.length === 0} className="w-full">
                    <Download className="mr-2" />
                    Download CSV
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={claims.length === 0} className="w-full">
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
        <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-base font-semibold">User Submissions ({claims.length})</h3>
              <p className="text-xs text-muted-foreground">{pendingClaimsCount} pending claims</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
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
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="outline">
                        <Zap className="mr-2" />
                        Distribute Pending
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Distribute all pending balances?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will transfer all users' pending balances to their main balances. This action is designed to be run periodically.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDistributePending}>Confirm & Run</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Wallet / Status</TableHead>
              <TableHead>Claim Amount</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Loading claims...
                </TableCell>
              </TableRow>
            ) : claims.length > 0 ? (
              claims.map((claim) => (
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
                  <TableCell className="text-xs">
                    {claim.walletAddress ? (
                      <div className="flex flex-col gap-1">
                          <span className="truncate max-w-xs">{claim.walletAddress}</span>
                           {claim.status === 'distributed' ? (
                             <Badge variant="default" className="w-fit bg-green-500 hover:bg-green-600">
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Distributed
                              </Badge>
                          ) : claim.status === 'processing' ? (
                              <Badge variant="secondary" className="w-fit">
                                  Processing
                              </Badge>
                          ) : (
                              <Badge variant="outline" className="w-fit">
                                  <Ban className="mr-2 h-4 w-4" />
                                  No Claim
                              </Badge>
                          )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="w-fit">
                          <Ban className="mr-2 h-4 w-4" />
                          No Claim
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-xs">
                    {`${(claim.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} MOO`}
                  </TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    {claim.status === 'processing' && (
                        <Button size="sm" onClick={() => handleDistribute(claim.userId, claim.walletAddress, claim.amount)}>
                            Distribute
                        </Button>
                    )}
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="icon" className="h-9 w-9">
                              <Trash2 className="h-4 w-4" />
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User: @{claim.username}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the user's profile and their airdrop claim.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(claim.userId)}>Confirm & Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No claims found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
