
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
import { History, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from 'date-fns';
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  const { distributionHistory } = useTelegram();
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 6;

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = distributionHistory.slice(indexOfFirstRecord, indexOfLastRecord);

  const totalPages = Math.ceil(distributionHistory.length / recordsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

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
            {currentRecords.length > 0 ? (
              currentRecords.map((record, index) => (
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

       {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="mr-2" />
            Previous
          </Button>
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
