
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

// Function to generate a unique referral code
const generateReferralCode = (existingCodes: Set<string>): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    do {
        code = 'M';
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (existingCodes.has(code));
    return code;
};


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

  const addReferral = (referrerId: string, refereeProfile: UserProfile) => {
    const storedData = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    const allReferrals: {[key: string]: Referral[]} = storedData.referrals || {};
    
    if (!allReferrals[referrerId]) {
      allReferrals[referrerId] = [];
    }
    if (!allReferrals[referrerId].some(r => r.username === refereeProfile.telegramUsername)) {
      allReferrals[referrerId].push({
          username: refereeProfile.telegramUsername,
          profilePictureUrl: refereeProfile.profilePictureUrl,
      });

      saveData({ referrals: allReferrals });
      return true;
    }
    return false;
  };
  
  const updateUserProfile = useCallback((updates: Partial<UserProfile>, userIdToUpdate?: string) => {
    const id = userIdToUpdate || userProfile?.id;
    if (!id) return;

    const storedData = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    const allUserProfiles = storedData.userProfiles || {};
    const profileToUpdate = allUserProfiles[id];
    
    if (!profileToUpdate) return;
    
    const updatedProfile = { ...profileToUpdate, ...updates };
    allUserProfiles[id] = updatedProfile;

    let currentLeaderboard = storedData.leaderboard || [];
    const userIndexInLeaderboard = currentLeaderboard.findIndex((p: LeaderboardEntry) => p.username === updatedProfile.telegramUsername);
    
    if (userIndexInLeaderboard !== -1) {
        currentLeaderboard[userIndexInLeaderboard].balance = updatedProfile.mainBalance;
    } else {
        // This case handles updating a user who might not be on the leaderboard yet,
        // which can happen if the referrer is not the current user.
        currentLeaderboard.push({
            rank: 0, // Rank will be recalculated below
            username: updatedProfile.telegramUsername,
            balance: updatedProfile.mainBalance,
            profilePictureUrl: updatedProfile.profilePictureUrl
        });
    }
    currentLeaderboard.sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.balance - a.balance).forEach((p: LeaderboardEntry, i: number) => p.rank = i + 1);
    
    // If the update is for the currently logged-in user, update their state
    if (id === userProfile?.id) {
        setUserProfile(updatedProfile);
        setLeaderboard(currentLeaderboard);
    }
    
    saveData({ userProfiles: allUserProfiles, leaderboard: currentLeaderboard });
  }, [userProfile]);


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
    const currentAirdropStatus: boolean = storedData.isAirdropLive === undefined ? true : storedData.isAirdropLive;

    let currentUserProfile = allUserProfiles[userId];
    const existingReferralCodes = new Set(Object.values(allUserProfiles).map(p => p.referralCode).filter(Boolean) as string[]);

    if (!currentUserProfile) {
        const newReferralCode = generateReferralCode(existingReferralCodes);
        currentUserProfile = {
            ...defaultUserProfile,
            id: userId,
            telegramUsername: telegramUser.username || `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
            profilePictureUrl: telegramUser.photo_url || `https://picsum.photos/seed/${userId}/100/100`,
            isPremium: !!telegramUser.is_premium,
            referralCode: newReferralCode,
        };
        allUserProfiles[userId] = currentUserProfile;
    } else if (!currentUserProfile.referralCode) {
        const newReferralCode = generateReferralCode(existingReferralCodes);
        currentUserProfile.referralCode = newReferralCode;
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
    }
    currentLeaderboard.sort((a,b) => b.balance - a.balance).forEach((p, i) => p.rank = i + 1);


    // Handle referral from URL
    const startParam = tg.initDataUnsafe.start_param;
    if (startParam && startParam.startsWith('ref')) {
        const referrerCode = startParam.substring(3);
        const referrerProfile = Object.values(allUserProfiles).find(p => p.referralCode === referrerCode);
        if (referrerProfile && referrerProfile.id !== userId) {
            if(!currentUserProfile.referredBy) {
              const wasAdded = addReferral(referrerProfile.id, currentUserProfile);
              if (wasAdded) {
                  currentUserProfile.referredBy = referrerProfile.id;
                  // Reward referrer
                  const newReferrerBalance = referrerProfile.mainBalance + 100;
                  referrerProfile.mainBalance = newReferrerBalance;
                  allUserProfiles[referrerProfile.id] = referrerProfile;

                  // Reward referee
                  const newRefereeBalance = currentUserProfile.mainBalance + 100;
                  currentUserProfile.mainBalance = newRefereeBalance;
                  currentUserProfile.completedSocialTasks = {
                    ...currentUserProfile.completedSocialTasks,
                    referral: 'completed'
                  };
              }
              allUserProfiles[userId] = currentUserProfile;
            }
        }
    }

    // Set all states
    setUserProfile(currentUserProfile);
    setLeaderboard(currentLeaderboard);
    setClaimedAirdrops(currentClaimedAirdrops);
    setReferrals(allReferrals[userId] || []);
    setIsAirdropLive(currentAirdropStatus);

    saveData({ 
        userProfiles: allUserProfiles, 
        referrals: allReferrals, 
        leaderboard: currentLeaderboard, 
        claimedAirdrops: currentClaimedAirdrops,
        isAirdropLive: currentAirdropStatus,
    });

  }, []);

  const redeemReferralCode = useCallback((referralCode: string): {success: boolean, message: string, referrerId?: string} => {
    if (!userProfile) return {success: false, message: "User profile not loaded."};

    if (referralCode === userProfile.referralCode) {
        return {success: false, message: "You cannot redeem your own referral code."};
    }
    
    const storedData = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    const allUserProfiles: {[key: string]: UserProfile} = storedData.userProfiles || {};

    const referrerProfile = Object.values(allUserProfiles).find(p => p.referralCode === referralCode && p.id !== userProfile.id);

    if (!referrerProfile) {
        return {success: false, message: "Invalid referral code. User not found."};
    }

    if (userProfile.referredBy) {
        return {success: false, message: "You have already redeemed a referral code."};
    }

    const wasAdded = addReferral(referrerProfile.id, userProfile);

    if (wasAdded) {
      // Reward referee
      updateUserProfile({ referredBy: referrerProfile.id, mainBalance: userProfile.mainBalance + 100 });
      
      // Reward referrer
      const newReferrerBalance = referrerProfile.mainBalance + 100;
      updateUserProfile({ mainBalance: newReferrerBalance }, referrerProfile.id);

      return {success: true, message: "Referral code redeemed successfully!", referrerId: referrerProfile.id};
    } else {
      return {success: false, message: "Referral could not be added. You might have already been referred."};
    }
  }, [userProfile, updateUserProfile]);

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
