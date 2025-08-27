import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockUser, mockReferrals } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { mockLeaderboard } from '@/lib/data';

export default function ProfilePage() {
    const userRank = mockLeaderboard.find(entry => entry.username === mockUser.telegramUsername)?.rank;

  return (
    <div className="container mx-auto p-4 space-y-6 animate-fade-in">
      <div className="flex flex-col items-center space-y-4">
        <Avatar className="w-32 h-32 border-4 border-primary shadow-lg">
          <AvatarImage src={mockUser.profilePictureUrl} alt={mockUser.telegramUsername} data-ai-hint="profile picture" />
          <AvatarFallback>{mockUser.telegramUsername.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold">@{mockUser.telegramUsername}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Main Balance</span>
            <span className="font-semibold">{mockUser.mainBalance.toLocaleString()} MOO</span>
          </div>
          <Separator/>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Pending Balance</span>
            <span className="font-semibold">{mockUser.pendingBalance.toLocaleString()} MOO</span>
          </div>
          <Separator/>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Referrals</span>
            <span className="font-semibold">{mockReferrals.length} Friends</span>
          </div>
          <Separator/>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Leaderboard Rank</span>
            <span className="font-semibold">{userRank ? `#${userRank}` : 'N/A'}</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
            <Button variant="destructive" className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect Wallet
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
