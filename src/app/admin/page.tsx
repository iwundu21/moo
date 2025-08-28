
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
import { Download, Power, Loader2 } from 'lucide-react';
import { useTelegram } from '@/hooks/use-telegram';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const { claimedAirdrops, isAirdropLive, setAirdropStatus, isClient } = useTelegram();

  const downloadCSV = () => {
    if (claimedAirdrops.length === 0) return;

    const headers = ['Wallet Address', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...claimedAirops.map(claim => 
        [claim.walletAddress, claim.amount].join(',')
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

       <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
        <h3 className="text-base font-semibold">Airdrop Controls</h3>
        <div className="flex items-center space-x-4 p-4 rounded-md bg-secondary/50 min-h-[80px]">
            {!isClient ? (
              <div className="flex items-center justify-center w-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <Power className={cn("w-6 h-6", isAirdropLive ? "text-green-500" : "text-destructive")} />
                <div className="flex-1">
                    <Label htmlFor="airdrop-switch" className="font-semibold">
                        Airdrop Claiming
                    </Label>
                    <p className={cn("text-xs", isAirdropLive ? 'text-green-400' : 'text-yellow-500')}>
                        {isAirdropLive ? 'Live - Users can claim their airdrop.' : 'Disabled - Claiming is currently paused.'}
                    </p>
                </div>
                <Switch
                    id="airdrop-switch"
                    checked={isAirdropLive}
                    onCheckedChange={setAirdropStatus}
                    aria-label="Toggle airdrop claiming"
                />
              </>
            )}
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Wallet Address</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claimedAirdrops.length > 0 ? (
              claimedAirdrops.map((claim, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">@{claim.username}</TableCell>
                  <TableCell className="text-xs">{claim.walletAddress}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {claim.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
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
