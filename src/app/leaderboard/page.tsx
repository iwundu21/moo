

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, BadgeCheck, ChevronLeft, ChevronRight, CheckCircle, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTelegram } from "@/hooks/use-telegram";
import { useEffect, useState, useMemo } from "react";
import type { LeaderboardEntry, AirdropClaim } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LeaderboardPage() {
  const { userProfile, leaderboard, airdropClaims, totalUserCount } = useTelegram();
  const [userRank, setUserRank] = useState<LeaderboardEntry | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [claimedCurrentPage, setClaimedCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    if (userProfile) {
      const rank = leaderboard.find(entry => entry.username === userProfile.telegramUsername);
      setUserRank(rank);
    }
  }, [userProfile, leaderboard]);

  // Pagination for Leaderboard
  const leaderboardPages = Math.ceil(leaderboard.length / recordsPerPage);
  const currentLeaderboardRecords = leaderboard.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);
  
  // Pagination for Claimed Users
  const claimedPages = Math.ceil(airdropClaims.length / recordsPerPage);
  const currentClaimedRecords = airdropClaims.slice((claimedCurrentPage - 1) * recordsPerPage, claimedCurrentPage * recordsPerPage);

  const handleNextPage = () => {
    if (currentPage < leaderboardPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleClaimedNextPage = () => {
    if (claimedCurrentPage < claimedPages) {
      setClaimedCurrentPage(claimedCurrentPage + 1);
    }
  };

  const handleClaimedPrevPage = () => {
    if (claimedCurrentPage > 1) {
      setClaimedCurrentPage(claimedCurrentPage - 1);
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

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="leaderboard">Top Players</TabsTrigger>
          <TabsTrigger value="claimed">Claimed Airdrops</TabsTrigger>
        </TabsList>
        <TabsContent value="leaderboard">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentLeaderboardRecords.map((entry) => (
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
          {leaderboardPages > 1 && (
            <div className="flex items-center justify-center space-x-4 mt-4">
              <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}>
                <ChevronLeft className="mr-2" />
                Previous
              </Button>
              <span className="text-sm font-medium">Page {currentPage} of {leaderboardPages}</span>
              <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === leaderboardPages}>
                Next
                <ChevronRight className="ml-2" />
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="claimed">
           <div className="rounded-lg border bg-card text-card-foreground shadow-sm mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount / Wallet</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentClaimedRecords.length > 0 ? currentClaimedRecords.map((claim) => (
                  <TableRow key={claim.userId}>
                    <TableCell className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-8 h-8">
                              <AvatarImage src={claim.profilePictureUrl} data-ai-hint="profile picture" />
                              <AvatarFallback>{claim.username.substring(0, 1)}</AvatarFallback>
                          </Avatar>
                          {claim.isPremium && <BadgeCheck className="absolute -bottom-1 -right-1 w-4 h-4 text-blue-500" />}
                        </div>
                        <span className="font-medium truncate text-xs">@{claim.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">{claim.amount.toLocaleString()} MOO</span>
                          <span className="text-muted-foreground font-mono truncate max-w-[150px]">{claim.walletAddress}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                       {claim.status === 'distributed' ? (
                           <Badge variant="default" className="w-fit bg-green-500 hover:bg-green-600">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Distributed
                            </Badge>
                        ) : claim.status === 'processing' ? (
                            <Badge variant="secondary" className="w-fit">
                                Processing
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="w-fit">
                                <Ban className="mr-2 h-4 w-4" />
                                No Claim
                            </Badge>
                        )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">No airdrop claims yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {claimedPages > 1 && (
            <div className="flex items-center justify-center space-x-4 mt-4">
              <Button variant="outline" size="sm" onClick={handleClaimedPrevPage} disabled={claimedCurrentPage === 1}>
                <ChevronLeft className="mr-2" />
                Previous
              </Button>
              <span className="text-sm font-medium">Page {claimedCurrentPage} of {claimedPages}</span>
              <Button variant="outline" size="sm" onClick={handleClaimedNextPage} disabled={claimedCurrentPage === claimedPages}>
                Next
                <ChevronRight className="ml-2" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
