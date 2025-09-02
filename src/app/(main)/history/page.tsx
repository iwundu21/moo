

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTelegram } from '@/hooks/use-telegram';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import Image from 'next/image';

export default function HistoryPage() {
    const { claimHistory } = useTelegram();
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 7;

    const totalPages = Math.ceil(claimHistory.length / recordsPerPage);

    const currentHistory = useMemo(() => {
        const startIndex = (currentPage - 1) * recordsPerPage;
        return claimHistory.slice(startIndex, startIndex + recordsPerPage);
    }, [claimHistory, currentPage, recordsPerPage]);

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
                <h1 className="text-xl font-bold tracking-tight">History</h1>
                <p className="text-xs text-muted-foreground">Your earnings and claim history.</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Claim History</CardTitle>
                    <CardDescription>A log of your recent balance claims.</CardDescription>
                </CardHeader>
                <CardContent>
                    {claimHistory.length > 0 ? (
                        <div className="space-y-4">
                            {currentHistory.map((claim) => (
                                <div key={claim.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/20 text-primary">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">Balance Claimed</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(claim.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm font-bold text-green-500 shrink-0">
                                        <span className="break-all">+ {claim.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                                        <Image src="/moo logo.jpg" alt="MOO logo" width={16} height={16} className="rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">
                            You haven't made any claims yet.
                        </p>
                    )}
                </CardContent>
            </Card>

             {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-4">
                    <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Prev
                    </Button>
                    <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            )}

        </div>
    );
}
