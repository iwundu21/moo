
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTelegram } from "@/hooks/use-telegram";
import { useEffect, useState } from "react";
import type { LeaderboardEntry } from "@/lib/types";


export default function LeaderboardPage() {
  const { userProfile, leaderboard } = useTelegram();
  const [userRank, setUserRank] = useState<LeaderboardEntry | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (userProfile) {
      const rank = leaderboard.find(entry => entry.username === userProfile.telegramUsername);
      setUserRank(rank);
    }
  }, [userProfile, leaderboard]);

  if (!isClient || !userProfile) {
    return null; // Or a loading spinner
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">See who's at the top of the MOO-niverse!</p>
      </header>

      {userRank && (
        <Card className="border-primary bg-primary/20">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold w-8 text-center">{userRank.rank}</span>
                <Avatar>
                  <AvatarImage src={userProfile.profilePictureUrl} data-ai-hint="profile picture"/>
                  <AvatarFallback>{userProfile.telegramUsername.substring(0,1)}</AvatarFallback>
                </Avatar>
                <div className="font-semibold">
                  <p>You</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{userRank.balance.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">MOO</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((entry) => (
                <TableRow key={entry.rank} className={cn(entry.username === userProfile.telegramUsername && "bg-accent/20", "bg-transparent hover:bg-white/5")}>
                  <TableCell className="font-bold">
                    <div className="flex items-center justify-center">
                        {entry.rank <= 3 ? <Trophy className={cn("w-4 h-4 mr-2", entry.rank === 1 && "text-yellow-400", entry.rank === 2 && "text-gray-400", entry.rank === 3 && "text-yellow-600")} /> : null}
                        {entry.rank}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={entry.profilePictureUrl} data-ai-hint="profile picture" />
                        <AvatarFallback>{entry.username.substring(0, 1)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium truncate">@{entry.username}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{entry.balance.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </Card>
    </div>
  );
}
