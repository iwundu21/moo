
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockUser, mockDistributionHistory } from '@/lib/data';
import { useEffect, useState } from 'react';

export default function AirdropPage({}: {}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
              <p className="text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                {mockUser.mainBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
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
