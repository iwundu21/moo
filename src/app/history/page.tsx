
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DailyEarningsChart } from '@/components/DailyEarningsChart';
import { useTelegram } from '@/hooks/use-telegram';
import { Gem, Activity } from 'lucide-react';

export default function HistoryPage() {
    const { claimHistory } = useTelegram();

    return (
        <div className="container mx-auto p-4 space-y-6">
            <header className="text-center space-y-2">
                <h1 className="text-xl font-bold tracking-tight">History</h1>
                <p className="text-xs text-muted-foreground">Your earnings and claim history.</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Daily Earnings</CardTitle>
                    <CardDescription>A look at your recent earnings activity.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DailyEarningsChart />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Claim History</CardTitle>
                    <CardDescription>A log of your recent balance claims.</CardDescription>
                </CardHeader>
                <CardContent>
                    {claimHistory.length > 0 ? (
                        <div className="space-y-4">
                            {claimHistory.map((claim) => (
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
                                    <div className="flex items-center gap-1 text-sm font-bold text-green-500">
                                        + {claim.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                        <Gem className="w-4 h-4 ml-1" />
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

        </div>
    );
}
