
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
import { Download, Power, Trash2 } from 'lucide-react';
import { useTelegram } from '@/hooks/use-telegram';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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


export default function AdminPage() {
  const { claimedAirdrops, isAirdropLive, setAirdropStatus, clearAllClaims } = useTelegram();

  const downloadCSV = () => {
    if (claimedAirdrops.length === 0) return;

    const headers = ['User ID', 'Username', 'Wallet Address', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...claimedAirdrops.map(claim => 
        [claim.userId, claim.username, claim.walletAddress, claim.amount].join(',')
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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <header className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground">Manage airdrop claims and settings</p>
        </header>
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
                      <AlertDialogAction onClick={clearAllClaims}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
            <h3 className="text-base font-semibold">Claim Submissions ({claimedAirdrops.length})</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Wallet Address</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claimedAirdrops.length > 0 ? (
              claimedAirdrops.map((claim, index) => (
                <TableRow key={index}>
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
                  <TableCell className="text-right font-semibold">
                    {claim.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} MOO
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
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
