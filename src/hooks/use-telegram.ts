
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { UserProfile, LeaderboardEntry, Referral, DistributionRecord, AirdropClaim } from '@/lib/types';
import { defaultUserProfile, mockDistributionHistory } from '@/lib/data';
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
  const [distributionHistory, setDistributionHistory] = useState<DistributionRecord[]>(mockDistributionHistory);
  const [claimedAirdrops, setClaimedAirdrops] = useState<AirdropClaim[]>([]);
  const [isAirdropLive, setIsAirdropLive] = useState<boolean>(true);
  const [isClient, setIsClient] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);


  useEffect(() => {
    setIsClient(true);
    
    let isMounted = true;

    const initTelegram = () => {
      if (!isMounted) return;

      const tg = window.Telegram?.WebApp;

      const updateUserState = (userId: string) => {
        if (!userId) return;
        const profile = store.getUserProfile(userId);
        setUserProfile(profile);
        setLeaderboard(store.getLeaderboard());
        setClaimedAirdrops(store.getClaimedAirdrops());
        setIsAirdropLive(store.getAirdropStatus());
        setReferrals(store.getReferrals(userId));
        setCurrentUserId(userId);
      };

      const handleStoreUpdate = () => {
        if (currentUserId) {
          updateUserState(currentUserId);
        }
      };

      store.subscribe(handleStoreUpdate);
      
      if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        tg.ready();
        const telegramUser = tg.initDataUnsafe.user;
        const userId = telegramUser.id.toString();

        let userProfile = store.getUserProfile(userId);

        if (!userProfile) {
          userProfile = {
            ...defaultUserProfile,
            id: userId,
            telegramUsername: telegramUser.username || `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
            profilePictureUrl: telegramUser.photo_url || `https://picsum.photos/seed/${telegramUser.id}/100/100`,
            isPremium: !!telegramUser.is_premium,
          };
          store.initialize(userProfile);
        }
        
        // Handle referral
        const startParam = tg.initDataUnsafe.start_param;
        if (startParam && startParam.startsWith('ref')) {
            const referrerId = startParam.substring(3);
            if (referrerId && referrerId !== userId) {
                const referrerProfile = store.getUserProfile(referrerId) || store.getAllUserProfiles()[referrerId];
                if(referrerProfile && userProfile) {
                     store.addReferral(referrerId, {
                        username: userProfile.telegramUsername,
                        profilePictureUrl: userProfile.profilePictureUrl,
                    });
                }
            }
        }
        
        updateUserState(userId);

      } else {
        // If Telegram Web App is not available, do nothing.
        // The app will wait for a real user.
        console.log("Telegram WebApp not found. App will not initialize data.");
      }

      return () => {
         store.unsubscribe(handleStoreUpdate);
      };
    };

    const unsubscribe = initTelegram();
    
    return () => { 
      isMounted = false; 
      if (unsubscribe) {
        unsubscribe();
      }
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
