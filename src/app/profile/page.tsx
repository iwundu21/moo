
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, Star, Users, Gem, Rocket, ShieldCheck, Twitter, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTelegram } from '@/hooks/use-telegram';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export default function ProfilePage() {
    const { userProfile, referrals, leaderboard } = useTelegram();
    const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<Set<number>>(new Set());

    const achievementColors = [
      '220 70% 50%',
      '160 60% 45%',
      '30 80% 55%',
      '280 65% 60%',
      '340 75% 55%',
      '260 80% 65%',
      '280 80% 70%',
      '200-80%-60%',
      '220 70% 50%',
      '160 60% 45%',
      '30 80% 55%',
      '280 65% 60%',
      '220 70% 50%',
      '160 60% 45%',
      '30 80% 55%',
      '280 65% 60%',
    ];

    useEffect(() => {
        if (userProfile) {
            const userRank = leaderboard.find(entry => entry.username === userProfile.telegramUsername)?.rank;

            const allAchievements = [
                { icon: Star, title: 'MOO Starter', description: 'Joined the MOO-niverse', unlocked: true },
                { icon: ShieldCheck, title: 'Licensed Miner', description: 'Activated mining license', unlocked: userProfile.isLicenseActive },
                { icon: Rocket, title: '2x Booster', description: 'Earn 10 MOO per message', unlocked: userProfile.purchasedBoosts.includes('2x') },
                { icon: Rocket, title: '5x Booster', description: 'Earn 20 MOO per message', unlocked: userProfile.purchasedBoosts.includes('5x') },
                { icon: Rocket, title: '10x Booster', description: 'Earn 35 MOO per message', unlocked: userProfile.purchasedBoosts.includes('10x') },
                { icon: Award, title: 'Top 1 Player', description: 'Reached the top spot!', unlocked: !!(userRank && userRank <= 1) },
                { icon: Award, title: 'Top 5 Player', description: 'Reached the top 5', unlocked: !!(userRank && userRank <= 5) },
                { icon: Award, title: 'Top 10 Player', description: 'Reached the top 10', unlocked: !!(userRank && userRank <= 10) },
                { icon: Users, title: 'Friendly Referrer', description: 'Referred one friend', unlocked: referrals.length > 0 },
                { icon: Gem, title: 'Premium User', description: 'Using Telegram Premium', unlocked: userProfile.isPremium },
                { icon: Twitter, title: 'X Follower', description: 'Followed on X', unlocked: userProfile.completedSocialTasks?.twitter === 'completed' },
                { icon: Send, title: 'Telegram Subscriber', description: 'Subscribed to channel', unlocked: userProfile.completedSocialTasks?.telegram === 'completed' },
                { icon: Users, title: 'Community Member', description: 'Joined the community', unlocked: userProfile.completedSocialTasks?.community === 'completed' },
            ];

            const unlocked = allAchievements.filter(ach => ach.unlocked);
            setUnlockedAchievements(unlocked);
            
            // Sequential flip animation
            const flipInterval = 300; // ms between flips
            unlocked.forEach((_, index) => {
                setTimeout(() => {
                    setFlippedIndices(prev => new Set(prev).add(index));
                    setTimeout(() => {
                         setFlippedIndices(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(index);
                            return newSet;
                         });
                    }, 2000); // How long the card stays flipped
                }, index * flipInterval);
            });

        }
    }, [userProfile, referrals, leaderboard]);
    
    if (!userProfile) {
        return null; // or a loading spinner
    }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col items-center space-y-2">
        <Avatar className="w-24 h-24 border-4 border-primary shadow-lg">
          <AvatarImage src={userProfile.profilePictureUrl} alt={userProfile.telegramUsername} data-ai-hint="profile picture" />
          <AvatarFallback>{userProfile.telegramUsername.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">@{userProfile.telegramUsername}</h1>
            {userProfile.isPremium ? (
                <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-white">
                    <Gem className="mr-1 h-3 w-3" />
                    Premium
                </Badge>
            ) : (
                <Badge variant="secondary">
                    Standard
                </Badge>
            )}
        </div>
        <p className="text-xs text-muted-foreground">Telegram ID: {userProfile.id}</p>
      </div>

      <div className="space-y-4 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <div>
          <h2 className="text-base font-semibold leading-none tracking-tight">Achievement Card</h2>
        </div>
        <div className="pt-2">
            {unlockedAchievements.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {unlockedAchievements.map((ach, index) => (
                        <div key={index} className={cn('flip-card perspective-1000', { 'is-flipped': flippedIndices.has(index) })}>
                            <div className="flip-card-inner">
                                <div className="flip-card-front">
                                    <div 
                                    className={cn(
                                        'bg-card/80 backdrop-blur border shadow-lg flex flex-col items-center justify-center text-center w-full h-full p-4 rounded-lg relative overflow-hidden'
                                    )}
                                    style={{ 
                                        '--achievement-color': achievementColors[index % achievementColors.length] 
                                    } as React.CSSProperties}
                                    >
                                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[hsl(var(--achievement-color)_/_0.3)] to-transparent opacity-50"></div>
                                        <div className={cn("p-3 mb-2 rounded-lg bg-white/10")}>
                                          <ach.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <p className="font-semibold text-xs text-white">{ach.title}</p>
                                            <p className="text-xs text-white/80">{ach.description}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flip-card-back">
                                     <div 
                                      className={cn(
                                        'bg-card/80 backdrop-blur border shadow-lg flex flex-col items-center justify-center text-center w-full h-full p-4 rounded-lg relative overflow-hidden'
                                      )}
                                      style={{ 
                                        '--achievement-color': achievementColors[index % achievementColors.length] 
                                      } as React.CSSProperties}
                                    >
                                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[hsl(var(--achievement-color)_/_0.3)] to-transparent opacity-50"></div>
                                        <p className="text-3xl font-bold text-white">MOO</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground py-4 text-xs">No achievements unlocked yet.</p>
            )}
        </div>
      </div>
      
    </div>
  );
}
