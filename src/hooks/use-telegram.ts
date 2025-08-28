
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { UserProfile, LeaderboardEntry, Referral, DistributionRecord, AirdropClaim } from '@/lib/types';
import { defaultUserProfile } from '@/lib/data';
import { store } from '@/lib/store';

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

const useTelegram = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [distributionHistory, setDistributionHistory] = useState<DistributionRecord[]>([]);
  const [claimedAirdrops, setClaimedAirdrops] = useState<AirdropClaim[]>([]);
  const [isAirdropLive, setIsAirdropLive] = useState<boolean>(true);
  const [isClient, setIsClient] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);


  useEffect(() => {
    setIsClient(true);
    
    const tg = window.Telegram?.WebApp;
    if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) {
        console.log("Telegram WebApp not found. App will not initialize data.");
        return;
    }
    
    tg.ready();
    const telegramUser = tg.initDataUnsafe.user;
    const userId = telegramUser.id.toString();

    // Initialize user profile if it doesn't exist
    let user = store.getUserProfile(userId);
    if (!user) {
        user = {
            ...defaultUserProfile,
            id: userId,
            telegramUsername: telegramUser.username || `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
            profilePictureUrl: telegramUser.photo_url || `https://picsum.photos/seed/${telegramUser.id}/100/100`,
            isPremium: !!telegramUser.is_premium,
        };
        store.initialize(user);
    }
    
    setCurrentUserId(userId);

    // Handle referral
    const startParam = tg.initDataUnsafe.start_param;
    if (startParam && startParam.startsWith('ref')) {
        const referrerId = startParam.substring(3);
        if (referrerId && referrerId !== userId) {
            const referrerProfile = store.getUserProfile(referrerId) || store.getAllUserProfiles()[referrerId];
            if(referrerProfile && user) {
                 store.addReferral(referrerId, {
                    username: user.telegramUsername,
                    profilePictureUrl: user.profilePictureUrl,
                });
            }
        }
    }

  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const updateUserState = () => {
        const profile = store.getUserProfile(currentUserId);
        setUserProfile(profile);
        setLeaderboard(store.getLeaderboard());
        setClaimedAirdrops(store.getClaimedAirdrops());
        setIsAirdropLive(store.getAirdropStatus());
        setReferrals(store.getReferrals(currentUserId));
    };

    updateUserState(); // Initial update

    store.subscribe(updateUserState);
    return () => {
      store.unsubscribe(updateUserState);
    };

  }, [currentUserId]);


  const setAirdropStatus = useCallback((isLive: boolean) => {
    store.setAirdropStatus(isLive);
  }, []);

  const addClaimRecord = useCallback((claim: AirdropClaim) => {
    store.addClaimRecord(claim);
  }, []);

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    if (!currentUserId) return;
    store.updateUserProfile(currentUserId, updates);
  }, [currentUserId]);

  const addDistributionRecord = useCallback((record: DistributionRecord) => {
    // This is a local-only state update, might need to be moved to store if needed globally
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
