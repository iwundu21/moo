
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { UserProfile, LeaderboardEntry, Referral, DistributionRecord, AirdropClaim } from '@/lib/types';
import { defaultUserProfile, mockLeaderboard, mockReferrals, mockDistributionHistory } from '@/lib/data';
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(store.getUserProfile());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(store.getLeaderboard());
  const [referrals, setReferrals] = useState<Referral[]>(store.getReferrals());
  const [distributionHistory, setDistributionHistory] = useState<DistributionRecord[]>(mockDistributionHistory);
  const [claimedAirdrops, setClaimedAirdrops] = useState<AirdropClaim[]>(store.getClaimedAirdrops());
  const [isAirdropLive, setIsAirdropLive] = useState<boolean>(true); // Default to true, will be updated from store
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Initialize state from store only on the client
    setIsAirdropLive(store.getAirdropStatus());
    
    const handleStoreUpdate = () => {
      setUserProfile(store.getUserProfile());
      setLeaderboard(store.getLeaderboard());
      setClaimedAirdrops(store.getClaimedAirdrops());
      setIsAirdropLive(store.getAirdropStatus());
      setReferrals(store.getReferrals());
    };

    store.subscribe(handleStoreUpdate);

    // Initial check in case store is already populated
    if (!store.getUserProfile()) {
      let isMounted = true;
      let pollCount = 0;
      const maxPolls = 10;

      const initTelegram = () => {
        if (!isMounted) return;

        const tg = window.Telegram?.WebApp;
        if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
          tg.ready();
          const telegramUser = tg.initDataUnsafe.user;

          const initialProfile: UserProfile = {
                id: telegramUser.id.toString(),
                telegramUsername: telegramUser.username || `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
                profilePictureUrl: telegramUser.photo_url || `https://picsum.photos/seed/${telegramUser.id}/100/100`,
                mainBalance: defaultUserProfile.mainBalance,
                pendingBalance: defaultUserProfile.pendingBalance,
                isPremium: !!telegramUser.is_premium,
                purchasedBoosts: [],
                isLicenseActive: false,
                completedSocialTasks: { twitter: 'idle', telegram: 'idle', community: 'idle' },
                hasClaimedAirdrop: false,
              };
          
          store.initialize(initialProfile, mockLeaderboard, mockReferrals);
        } else if (pollCount < maxPolls) {
          pollCount++;
          setTimeout(initTelegram, 100);
        } else {
          console.log("Telegram WebApp not found. App will wait for real user data.");
          // In a real scenario, you might want to show a message to the user
          // For now, we initialize with a null/default state, and the UI should handle it.
           if (isMounted) {
            store.initialize(defaultUserProfile, [], []);
          }
        }
      };

      initTelegram();
      
      return () => { isMounted = false; };
    } else {
        handleStoreUpdate(); // Ensure state is synced on mount if store is already initialized
    }

     return () => {
      store.unsubscribe(handleStoreUpdate);
    };

  }, []);


  const setAirdropStatus = useCallback((isLive: boolean) => {
    store.setAirdropStatus(isLive);
  }, []);

  const addClaimRecord = useCallback((claim: AirdropClaim) => {
    store.addClaimRecord(claim);
  }, []);

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    store.updateUserProfile(updates);
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
