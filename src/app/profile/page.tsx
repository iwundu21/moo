import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockUser, mockReferrals } from '@/lib/data';
import { Award, Star, Users } from 'lucide-react';
import { mockLeaderboard } from '@/lib/data';

export default function ProfilePage() {
    const userRank = mockLeaderboard.find(entry => entry.username === mockUser.telegramUsername)?.rank;

    const achievements = [
      { icon: Star, title: 'MOO Starter', description: 'Joined the MOO-niverse', unlocked: true },
      { icon: Award, title: 'Top 10 Player', description: 'Reached the top 10', unlocked: !!(userRank && userRank <= 10) },
      { icon: Users, title: 'Friendly Referrer', description: 'Referred one friend', unlocked: mockReferrals.length > 0 },
    ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col items-center space-y-2">
        <Avatar className="w-32 h-32 border-4 border-primary shadow-lg">
          <AvatarImage src={mockUser.profilePictureUrl} alt={mockUser.telegramUsername} data-ai-hint="profile picture" />
          <AvatarFallback>{mockUser.telegramUsername.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold">@{mockUser.telegramUsername}</h1>
        <p className="text-sm text-muted-foreground">Telegram ID: {mockUser.id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {achievements.map((ach, index) => (
                    <Card key={index} className={`p-4 flex items-center gap-4 transition-opacity ${!ach.unlocked && 'opacity-40'}`}>
                        <div className="p-3 bg-primary/20 text-primary rounded-lg">
                           <ach.icon className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold">{ach.title}</p>
                            <p className="text-sm text-muted-foreground">{ach.description}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
