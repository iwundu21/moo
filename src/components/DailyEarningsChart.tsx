
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { useMemo } from 'react';

const chartConfig = {
  earnings: {
    label: 'Earnings',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function DailyEarningsChart() {
    const chartData = useMemo(() => {
        const data = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
        const dayOfWeek = today.getDay(); // Sunday - 0, Monday - 1, ...
        const daysToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
        
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - daysToMonday);

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dayOfMonth = date.getDate();

            let earnings: number | null = null;
            if (date <= today) {
                // Simulate earnings only for past and current days
                const isToday = date.getTime() === today.getTime();
                earnings = Math.floor(Math.random() * (isToday ? 300 : 500)) + (isToday ? 50 : 100);
            }

            data.push({
                day: days[i],
                date: dayOfMonth,
                earnings: earnings,
                fill: i === daysToMonday ? 'hsl(var(--primary))' : 'hsla(var(--primary) / 0.5)'
            });
        }
        return data;
    }, []);
    
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
