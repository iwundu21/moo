
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { UserProfile, LeaderboardEntry, Referral, DistributionRecord, AirdropClaim } from '@/lib/types';
import { defaultUserProfile } from '@/lib/data';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code: string;
  is_premium?: boolean;
  photo_url?: string;
}

interface TelegramWebApp {
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
  };
  ready: () => void;
  onEvent: (eventType: string, eventHandler: () => void) => void;
  isReady: boolean;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

const STORE_KEY = 'moo-app-data';

const useTelegram = () => {
  const [isClient, setIsClient] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [claimedAirdrops, setClaimedAirdrops] = useState<AirdropClaim[]>([]);
  const [isAirdropLive, setIsAirdropLive] = useState<boolean>(true);
  const [distributionHistory, setDistributionHistory] = useState<DistributionRecord[]>([]);

  const saveData = (data: any) => {
    if (typeof window !== 'undefined') {
        try {
            const currentData = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
            const newData = { ...currentData, ...data };
            localStorage.setItem(STORE_KEY, JSON.stringify(newData));
        } catch (e) {
            console.error("Failed to save data to localStorage", e);
        }
    }
  };

  useEffect(() => {
    setIsClient(true);

    const tg = window.Telegram?.WebApp;
    if (!tg?.initDataUnsafe?.user) {
        console.log("Telegram Web App user data not available. App will not initialize.");
        return;
    }

    tg.ready();
    const telegramUser = tg.initDataUnsafe.user;
    const userId = telegramUser.id.toString();

    // Load all data from storage
    const storedData = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    const allUserProfiles: {[key: string]: UserProfile} = storedData.userProfiles || {};
    const allReferrals: {[key: string]: Referral[]} = storedData.referrals || {};
    let currentLeaderboard: LeaderboardEntry[] = storedData.leaderboard || [];
    const currentClaimedAirdrops: AirdropClaim[] = storedData.claimedAirdrops || [];
    const currentAirdropStatus: boolean = storedData.isAirdropLive === undefined ? true : storedData.isAirdropLive;

    let currentUserProfile = allUserProfiles[userId];

    if (!currentUserProfile) {
        currentUserProfile = {
            ...defaultUserProfile,
            id: userId,
            telegramUsername: telegramUser.username || `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
            profilePictureUrl: telegramUser.photo_url || `https://picsum.photos/seed/${userId}/100/100`,
            isPremium: !!telegramUser.is_premium,
        };
        allUserProfiles[userId] = currentUserProfile;
    }
    
    // Add user to leaderboard if not present
    if (!currentLeaderboard.some(p => p.username === currentUserProfile!.telegramUsername)) {
        currentLeaderboard.push({
            rank: 0,
            username: currentUserProfile.telegramUsername,
            balance: currentUserProfile.mainBalance,
            profilePictureUrl: currentUserProfile.profilePictureUrl
        });
        currentLeaderboard.sort((a,b) => b.balance - a.balance).forEach((p, i) => p.rank = i + 1);
    }

    // Handle referral
    const startParam = tg.initDataUnsafe.start_param;
    if (startParam && startParam.startsWith('ref')) {
        const referrerId = startParam.substring(3);
        if (referrerId && referrerId !== userId) {
            if (!allReferrals[referrerId]) {
                allReferrals[referrerId] = [];
            }
            if (!allReferrals[referrerId].some(r => r.username === currentUserProfile.telegramUsername)) {
                allReferrals[referrerId].push({
                    username: currentUserProfile.telegramUsername,
                    profilePictureUrl: currentUserProfile.profilePictureUrl,
                });
            }
        }
    }

    // Set all states
    setUserProfile(currentUserProfile);
    setLeaderboard(currentLeaderboard);
    setClaimedAirdrops(currentClaimedAirdrops);
    setIsAirdropLive(currentAirdropStatus);
    setReferrals(allReferrals[userId] || []);

    // Save initial state to localStorage
    saveData({ 
        userProfiles: allUserProfiles, 
        referrals: allReferrals, 
        leaderboard: currentLeaderboard, 
        claimedAirdrops: currentClaimedAirdrops,
        isAirdropLive: currentAirdropStatus
    });

  }, []);

  const setAirdropStatus = useCallback((isLive: boolean) => {
    setIsAirdropLive(isLive);
    saveData({ isAirdropLive: isLive });
  }, []);

  const addClaimRecord = useCallback((claim: AirdropClaim) => {
    setClaimedAirdrops(prev => {
        const newClaims = [...prev, claim];
        saveData({ claimedAirdrops: newClaims });
        return newClaims;
    });
  }, []);

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setUserProfile(currentProfile => {
        if (!currentProfile) return null;

        const updatedProfile = { ...currentProfile, ...updates };
        
        const storedData = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
        const allUserProfiles = storedData.userProfiles || {};
        allUserProfiles[currentProfile.id] = updatedProfile;

        let currentLeaderboard = storedData.leaderboard || [];
        const userIndexInLeaderboard = currentLeaderboard.findIndex((p: LeaderboardEntry) => p.username === updatedProfile.telegramUsername);
        
        if (userIndexInLeaderboard !== -1) {
            currentLeaderboard[userIndexInLeaderboard].balance = updatedProfile.mainBalance;
            currentLeaderboard.sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.balance - a.balance).forEach((p: LeaderboardEntry, i: number) => p.rank = i + 1);
            setLeaderboard(currentLeaderboard);
        }

        saveData({ userProfiles: allUserProfiles, leaderboard: currentLeaderboard });
        return updatedProfile;
    });
  }, []);

  const addDistributionRecord = useCallback((record: DistributionRecord) => {
    setDistributionHistory(prevHistory => [record, ...prevHistory]);
  }, []);

  return { 
    userProfile, 
    leaderboard, 
    referrals, 
    distributionHistory, 
    claimedAirdrops, 
    isAirdropLive, 
    addDistributionRecord, 
    updateUserProfile, 
    addClaimRecord, 
    setAirdropStatus,
    isClient
  };
};

export { useTelegram };
