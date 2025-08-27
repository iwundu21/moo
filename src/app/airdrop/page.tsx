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

    </div>
  );
}
