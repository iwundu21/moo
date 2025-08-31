

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
import { Trophy, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTelegram } from "@/hooks/use-telegram";
import { useEffect, useState } from "react";
import type { LeaderboardEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function LeaderboardPage() {
  const { userProfile, leaderboard, totalUserCount } = useTelegram();
  const [userRank, setUserRank] = useState<LeaderboardEntry | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    if (userProfile) {
      const rank = leaderboard.find(entry => entry.username === userProfile.telegramUsername);
      setUserRank(rank);
    }
  }, [userProfile, leaderboard]);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = leaderboard.slice(indexOfFirstRecord, indexOfLastRecord);

  const totalPages = Math.ceil(leaderboard.length / recordsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (!userProfile) {
    return null; // Or a loading spinner
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-xs text-muted-foreground">
            {totalUserCount > 0 ? `Based on ${totalUserCount.toLocaleString()} total players` : "See who's at the top of the MOO-niverse!"}
        </p>
      </header>

      {userRank && (
        <div className="rounded-lg border border-primary bg-primary/20 p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-sm font-bold w-8 text-center flex-shrink-0">{userRank.rank}</span>
                 <div className="relative flex-shrink-0">
                    <Avatar>
                        <AvatarImage src={userProfile.profilePictureUrl} data-ai-hint="profile picture"/>
                        <AvatarFallback>{userProfile.telegramUsername.substring(0,1)}</AvatarFallback>
                    </Avatar>
                    {userProfile.isPremium && <BadgeCheck className="absolute -bottom-1 -right-1 w-5 h-5 text-blue-500" />}
                </div>
                <div className="font-semibold text-sm truncate">
                  <p>You</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="font-bold text-sm bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent whitespace-nowrap break-all">{(userProfile.lifetimeBalance || 0).toLocaleString()} MOO</p>
              </div>
            </div>
        </div>
      )}

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.map((entry) => (
                <TableRow key={entry.rank} className={cn(entry.username === userProfile.telegramUsername && "bg-accent/20", "bg-transparent hover:bg-white/5")}>
                  <TableCell className="font-bold text-xs text-center">
                    <div className="flex items-center justify-center">
                        {entry.rank <= 3 ? <Trophy className={cn("w-4 h-4 mr-2", entry.rank === 1 && "text-yellow-400", entry.rank === 2 && "text-gray-400", entry.rank === 3 && "text-yellow-600")} /> : null}
                        {entry.rank}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={entry.profilePictureUrl} data-ai-hint="profile picture" />
                            <AvatarFallback>{entry.username.substring(0, 1)}</AvatarFallback>
                        </Avatar>
                         {entry.isPremium && <BadgeCheck className="absolute -bottom-1 -right-1 w-4 h-4 text-blue-500" />}
                      </div>
                      <span className="font-medium truncate text-xs">@{entry.username}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-xs whitespace-nowrap">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent break-all">{entry.balance.toLocaleString()} MOO</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </div>

       {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="mr-2" />
            Previous
          </Button>
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
