
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
import { Download } from 'lucide-react';
import { useTelegram } from '@/hooks/use-telegram';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminPage() {
  const { claimedAirdrops } = useTelegram();

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
          <p className="text-xs text-muted-foreground">Airdrop Claim Submissions</p>
        </header>
        <Button onClick={downloadCSV} disabled={claimedAirdrops.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
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
