
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
import { Download, Trash2, Users, Gem, ShieldCheck, CheckCircle, Send, Ban, Zap, Search, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useTelegram } from '@/hooks/use-telegram';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useEffect, useState, useCallback, useMemo } from "react";
import type { AirdropClaim, UserProfile } from "@/lib/types";
import { collection, getDocs, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { format } from "date-fns";


export default function AdminPage() {
  const { appSettings, setAirdropStatus, setAirdropEndDate, clearAllClaims, totalMooGenerated, totalUserCount, totalLicensedUsers, updateClaimStatus, batchUpdateClaimStatuses, fetchAdminStats, deleteUser, fetchInitialData } = useTelegram();
  const [users, setUsers] = useState<AirdropClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState("23:59");
  const [timeLeft, setTimeLeft] = useState("");

  const fetchAllAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchAdminStats(), fetchInitialData()]);
      
      const usersQuery = query(collection(db, 'userProfiles'), orderBy('telegramUsername'));
      const usersSnapshot = await getDocs(usersQuery);

      const claimsSnapshot = await getDocs(collection(db, 'airdropClaims'));
      const claimsMap = new Map<string, AirdropClaim>();
      claimsSnapshot.forEach(doc => {
        const data = doc.data();
        // Ensure timestamp is a JS Date object
        if (data.timestamp && data.timestamp instanceof Timestamp) {
          data.timestamp = data.timestamp.toDate();
        }
        claimsMap.set(doc.id, data as AirdropClaim);
      });
      
      const combinedData: AirdropClaim[] = usersSnapshot.docs.map(userDoc => {
        const userProfile = userDoc.data() as UserProfile;
        const claimData = claimsMap.get(userProfile.id);

        return {
          userId: userProfile.id,
          username: userProfile.telegramUsername,
          profilePictureUrl: userProfile.profilePictureUrl,
          amount: claimData?.amount || userProfile.mainBalance,
          walletAddress: claimData?.walletAddress || userProfile.walletAddress || '',
          status: claimData?.status || 'no-claim',
          timestamp: claimData?.timestamp || new Date(0)
        };
      });
      
      combinedData.sort((a, b) => {
          const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
          const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
          return bTime - aTime;
      });

      setUsers(combinedData);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAdminStats, fetchInitialData]);

  useEffect(() => {
    fetchAllAdminData();
  }, [fetchAllAdminData]);

  useEffect(() => {
    if (appSettings.airdropEndDate) {
      setEndDate(appSettings.airdropEndDate);
      setEndTime(format(appSettings.airdropEndDate, "HH:mm"));
    } else {
      setEndDate(undefined);
      setEndTime("23:59");
    }
  }, [appSettings.airdropEndDate]);
  
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
  
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    return users.filter(user =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.userId.includes(searchQuery)
    );
  }, [searchQuery, users]);

  const claimedUsers = useMemo(() => {
    return filteredUsers.filter(user => user.status === 'processing' || user.status === 'distributed');
  }, [filteredUsers]);

  const downloadCSV = () => {
    if (claimedUsers.length === 0) return;
    const headers = ['Wallet Address', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...claimedUsers.map(claim => [claim.walletAddress, claim.amount].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) URL.revokeObjectURL(link.href);
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'airdrop_distribution.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleSetTimer = async () => {
    if (endDate) {
        const [hours, minutes] = endTime.split(':').map(Number);
        const newEndDate = new Date(endDate);
        newEndDate.setHours(hours, minutes, 0, 0);
        await setAirdropEndDate(newEndDate);
    }
  };

  const handleResetTimer = async () => {
    await setAirdropEndDate(null);
  };

  const handleClearClaims = async () => {
    await clearAllClaims();
    await fetchAllAdminData();
  };

  const handleDistribute = async (userId: string, walletAddress: string, amount: number) => {
    if (!walletAddress || amount <= 0) return;
    await updateClaimStatus(userId, 'distributed', walletAddress, amount);
    await fetchAllAdminData();
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteUser(userId);
    setUsers(prevUsers => prevUsers.filter(claim => claim.userId !== userId));
    fetchAdminStats();
  };

  const handleDistributeAll = async () => {
    const pendingClaims = users.filter(claim => claim.status === 'processing');
    if (pendingClaims.length === 0) return;
    await batchUpdateClaimStatuses(pendingClaims);
    await fetchAllAdminData();
  };
  
  const pendingClaimsCount = useMemo(() => users.filter(c => c.status === 'processing').length, [users]);

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold">Airdrop Control</h3>
                    <p className="text-xs text-muted-foreground">Enable or disable claims for all users.</p>
                </div>
                 <Switch
                    id="airdrop-status"
                    checked={appSettings.isAirdropLive}
                    onCheckedChange={setAirdropStatus}
                />
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current Status:</span>
                <Badge variant={appSettings.isAirdropLive ? "default" : "destructive"}>
                    {appSettings.isAirdropLive ? "Live" : "Paused"}
                </Badge>
            </div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
           <div>
                <h3 className="text-base font-semibold">Data Management</h3>
                <p className="text-xs text-muted-foreground">Download or clear claim data.</p>
            </div>
            <div className="flex gap-4">
                <Button onClick={downloadCSV} disabled={claimedUsers.length === 0} className="w-full">
                    <Download className="mr-2" />
                    Download CSV
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={users.filter(u => u.status !== 'no-claim').length === 0} className="w-full">
                        <Trash2 className="mr-2" />
                        Clear Claims
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all airdrop claim submissions and return the claimed MOO to each user's main balance. This action cannot be undone.
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
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
            <div>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-base font-semibold">Airdrop Schedule</h3>
                        <p className="text-xs text-muted-foreground">Set a countdown timer for the airdrop.</p>
                    </div>
                     {timeLeft && <Badge variant={timeLeft === "Ended" ? "outline" : "secondary"}>{timeLeft}</Badge>}
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <div className="relative">
                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSetTimer} className="w-full" disabled={!endDate}>Set Timer</Button>
                    <Button onClick={handleResetTimer} className="w-full" variant="destructive" disabled={!appSettings.airdropEndDate}>Reset</Button>
                </div>
            </div>
        </div>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-base font-semibold">User Submissions ({filteredUsers.length})</h3>
              <p className="text-xs text-muted-foreground">{pendingClaimsCount} pending claims</p>
            </div>
            <div className="relative w-full md:w-auto md:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by username or ID..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
        <div className="p-6 pt-0 flex flex-col sm:flex-row gap-2 w-full md:w-auto justify-end">
          <Button disabled={pendingClaimsCount === 0} onClick={handleDistributeAll}>
              <Send className="mr-2" />
              Distribute All ({pendingClaimsCount})
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Wallet / Status</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={user.profilePictureUrl} data-ai-hint="profile picture" />
                            <AvatarFallback>{user.username.substring(0, 1)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-medium text-xs">@{user.username}</span>
                            <span className="text-xs text-muted-foreground font-mono">{user.userId}</span>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex flex-col gap-1">
                        <span className="truncate max-w-xs break-all">{user.walletAddress || 'N/A'}</span>
                         {user.status === 'distributed' ? (
                           <Badge variant="default" className="w-fit bg-green-500 hover:bg-green-600">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Distributed
                            </Badge>
                        ) : user.status === 'processing' ? (
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
                  </TableCell>
                  <TableCell className="font-semibold text-xs">
                    {`${(user.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} MOO`}
                  </TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    {user.status === 'processing' && (
                        <Button size="sm" onClick={() => handleDistribute(user.userId, user.walletAddress, user.amount)}>
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
                            <AlertDialogTitle>Delete User: @{user.username}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the user's profile and their airdrop claim. Are you sure?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user.userId)}>Confirm & Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  {searchQuery ? "No users found for your search." : "No users found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
