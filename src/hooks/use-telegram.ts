
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
  openInvoice: (url: string, callback: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void) => void;
  close: () => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

const STORE_KEY = 'moo-app-data-v2';

const useTelegram = () => {
  const [isClient, setIsClient] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [claimedAirdrops, setClaimedAirdrops] = useState<AirdropClaim[]>([]);
  const [distributionHistory, setDistributionHistory] = useState<DistributionRecord[]>([]);
  const [isAirdropLive, setIsAirdropLive] = useState<boolean>(true);


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

  const addReferral = (referrerId: string, refereeProfile: UserProfile) => {
    const storedData = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    const allReferrals: {[key: string]: Referral[]} = storedData.referrals || {};
    const allUserProfiles: {[key: string]: UserProfile} = storedData.userProfiles || {};

    if (!allReferrals[referrerId]) {
      allReferrals[referrerId] = [];
    }
    if (!allReferrals[referrerId].some(r => r.username === refereeProfile.telegramUsername)) {
      allReferrals[referrerId].push({
          username: refereeProfile.telegramUsername,
          profilePictureUrl: refereeProfile.profilePictureUrl,
      });

      // Update referrer's profile if they exist
      if(allUserProfiles[referrerId]) {
        // You could add a referral bonus here if you want
      }
      
      saveData({ referrals: allReferrals });
      return true;
    }
    return false;
  };


  useEffect(() => {
    setIsClient(true);

    const tg = window.Telegram?.WebApp;
    if (!tg?.initDataUnsafe?.user) {
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
    const airdropStatus = storedData.isAirdropLive === undefined ? true : storedData.isAirdropLive;

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

    // Handle referral from URL
    const startParam = tg.initDataUnsafe.start_param;
    if (startParam && startParam.startsWith('ref')) {
        const referrerId = startParam.substring(3);
        if (referrerId && referrerId !== userId) {
            addReferral(referrerId, currentUserProfile);
        }
    }

    // Set all states
    setUserProfile(currentUserProfile);
    setLeaderboard(currentLeaderboard);
    setClaimedAirdrops(currentClaimedAirdrops);
    setReferrals(allReferrals[userId] || []);
    setIsAirdropLive(airdropStatus);

    // Save initial state to localStorage
    saveData({ 
        userProfiles: allUserProfiles, 
        referrals: allReferrals, 
        leaderboard: currentLeaderboard, 
        claimedAirdrops: currentClaimedAirdrops,
        isAirdropLive: airdropStatus,
    });

  }, []);

  const redeemReferralCode = useCallback((referrerId: string): {success: boolean, message: string} => {
    if (!userProfile) return {success: false, message: "User profile not loaded."};

    if (referrerId === userProfile.id) {
        return {success: false, message: "You cannot redeem your own referral code."};
    }
    
    const storedData = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    const allUserProfiles: {[key: string]: UserProfile} = storedData.userProfiles || {};

    if (!allUserProfiles[referrerId]) {
        return {success: false, message: "Invalid referral code. User not found."};
    }

    if (userProfile.referredBy) {
        return {success: false, message: "You have already redeemed a referral code."};
    }

    const wasAdded = addReferral(referrerId, userProfile);

    if (wasAdded) {
      updateUserProfile({ referredBy: referrerId });
      return {success: true, message: "Referral code redeemed successfully!"};
    } else {
      return {success: false, message: "Referral could not be added. You might have already been referred."};
    }
  }, [userProfile]);

  const addClaimRecord = useCallback((claim: AirdropClaim) => {
    setClaimedAirdrops(prev => {
        const newClaims = [...prev, claim];
        saveData({ claimedAirdrops: newClaims });
        return newClaims;
    });
  }, []);

  const clearAllClaims = useCallback(() => {
    setClaimedAirdrops([]);
    saveData({ claimedAirdrops: [] });
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
  
  const setAirdropStatus = useCallback((isLive: boolean) => {
    setIsAirdropLive(isLive);
    saveData({ isAirdropLive: isLive });
  }, []);

  return { 
    userProfile, 
    leaderboard, 
    referrals, 
    distributionHistory, 
    claimedAirdrops,
    isAirdropLive,
    setAirdropStatus,
    clearAllClaims,
    addDistributionRecord, 
    updateUserProfile, 
    addClaimRecord,
    redeemReferralCode, 
    isClient
  };
};

export { useTelegram };
