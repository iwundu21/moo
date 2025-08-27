import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockUser } from '@/lib/data';
import { CheckCircle, Radio } from 'lucide-react';

const tasks = [
    { title: "Join Telegram Channel", completed: true },
    { title: "Follow on X", completed: true },
    { title: "Retweet Pinned Post", completed: false },
    { title: "Visit Website", completed: true },
]

export default function AirdropPage({}: {}) {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Airdrop</h1>
        <p className="text-muted-foreground">Complete tasks to earn more MOO!</p>
      </header>
      
      <Card className="text-center">
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
          <CardTitle>Airdrop Tasks</CardTitle>
          <CardDescription>Complete these tasks to be eligible for more rewards.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="space-y-3">
                {tasks.map((task, index) => (
                    <li key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <span className="font-medium">{task.title}</span>
                        {task.completed ? (
                            <CheckCircle className="text-green-500" />
                        ) : (
                            <Radio className="text-muted-foreground/50" />
                        )}
                    </li>
                ))}
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
