
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, Star, Users, Gem, Rocket, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTelegram } from '@/hooks/use-telegram';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export default function ProfilePage() {
    const { userProfile, referrals, leaderboard } = useTelegram();
    const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([]);

    const achievementColors = [
      'hsl(220 70% 50%)',
      'hsl(160 60% 45%)',
      'hsl(30 80% 55%)',
      'hsl(280 65% 60%)',
      'hsl(340 75% 55%)',
      'hsl(260 80% 65%)',
      'hsl(280 80% 70%)',
      'hsl(200 80% 60%)',
    ];

    useEffect(() => {
        if (userProfile) {
            const userRank = leaderboard.find(entry => entry.username === userProfile.telegramUsername)?.rank;

            const allAchievements = [
                { icon: Star, title: 'MOO Starter', description: 'Joined the MOO-niverse', unlocked: true },
                { icon: ShieldCheck, title: 'Licensed Miner', description: 'Activated mining license', unlocked: userProfile.isLicenseActive },
                { icon: Rocket, title: '2x Booster', description: 'Purchased the 2x boost', unlocked: userProfile.purchasedBoosts.includes('2x') },
                { icon: Rocket, title: '5x Booster', description: 'Purchased the 5x boost', unlocked: userProfile.purchasedBoosts.includes('5x') },
                { icon: Rocket, title: '10x Booster', description: 'Purchased the 10x boost', unlocked: userProfile.purchasedBoosts.includes('10x') },
                { icon: Award, title: 'Top 10 Player', description: 'Reached the top 10', unlocked: !!(userRank && userRank <= 10) },
                { icon: Users, title: 'Friendly Referrer', description: 'Referred one friend', unlocked: referrals.length > 0 },
                { icon: Gem, title: 'Premium User', description: 'Using Telegram Premium', unlocked: userProfile.isPremium },
            ];

            setUnlockedAchievements(allAchievements.filter(ach => ach.unlocked));
        }
    }, [userProfile, referrals, leaderboard]);
    
    if (!userProfile) {
        return null; // or a loading spinner
    }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col items-center space-y-2">
        <Avatar className="w-32 h-32 border-4 border-primary shadow-lg">
          <AvatarImage src={userProfile.profilePictureUrl} alt={userProfile.telegramUsername} data-ai-hint="profile picture" />
          <AvatarFallback>{userProfile.telegramUsername.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">@{userProfile.telegramUsername}</h1>
            {userProfile.isPremium && (
                <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-white">
                    <Gem className="mr-1 h-3 w-3" />
                    Premium
                </Badge>
            )}
        </div>
        <p className="text-sm text-muted-foreground">Telegram ID: {userProfile.id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
            {unlockedAchievements.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {unlockedAchievements.map((ach, index) => (
                        <div key={index} 
                          className={cn(
                            buttonVariants({ variant: 'achievement-card' }),
                            'flex flex-col items-center justify-center text-center aspect-square h-auto p-4 cursor-default'
                          )}
                          style={{ 
                            '--achievement-color': achievementColors[index % achievementColors.length] 
                          } as React.CSSProperties}
                        >
                            <div className={cn("p-3 mb-2 rounded-lg bg-white/10")}>
                               <ach.icon className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <p className="font-semibold text-sm text-white">{ach.title}</p>
                                <p className="text-xs text-white/80">{ach.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground py-4">No achievements unlocked yet.</p>
            )}
        </CardContent>
      </Card>
      
    </div>
  );
}
