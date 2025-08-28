
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTelegram } from "@/hooks/use-telegram";
import { History, Coins } from "lucide-react";
import { format } from 'date-fns';

export default function HistoryPage() {
  const { distributionHistory } = useTelegram();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="text-center space-y-2">
         <History className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Distribution History</h1>
        <p className="text-xs text-muted-foreground">A record of your hourly MOO distributions.</p>
      </header>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {distributionHistory.length > 0 ? (
              distributionHistory.map((record, index) => (
                <TableRow key={index}>
                  <TableCell className="text-xs">
                    {format(new Date(record.timestamp), 'MMM dd, yyyy')}
                  </TableCell>
                   <TableCell className="text-xs">
                    {format(new Date(record.timestamp), 'p')}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-xs text-green-500 flex items-center justify-end gap-1">
                    + {record.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    <span className="text-primary">MOO</span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-xs">
                  No distribution history yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
