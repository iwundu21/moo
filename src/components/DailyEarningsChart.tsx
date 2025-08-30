
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { useMemo } from 'react';
import { useTelegram } from '@/hooks/use-telegram';

const chartConfig = {
  earnings: {
    label: 'Earnings',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function DailyEarningsChart() {
    const { claimHistory } = useTelegram();

    const chartData = useMemo(() => {
        // This component will now show an empty state.
        // The data logic has been removed to avoid showing mock data.
        return [];
    }, []);

    if (chartData.length === 0) {
        return (
            <div className="flex min-h-[200px] w-full items-center justify-center rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground">
                    Daily earnings data will be available soon.
                </p>
            </div>
        );
    }
    
    return (
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                        dataKey="day"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value, index) => `${value}\n${chartData[index].date}`}
                        className='text-xs'
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        width={80}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent 
                            labelFormatter={(label, payload) => `${label} - ${payload?.[0]?.payload?.date || ''}`}
                            formatter={(value) => value === null ? 'No data' : `$${(value as number).toLocaleString()}`} 
                        />}
                    />
                    <Bar dataKey="earnings" radius={8} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
