
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { UserProfile, LeaderboardEntry, Referral, DistributionRecord, AirdropClaim } from '@/lib/types';
import { mockLeaderboard, mockReferrals, mockDistributionHistory } from '@/lib/data';
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
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [distributionHistory, setDistributionHistory] = useState<DistributionRecord[]>(mockDistributionHistory);
  const [claimedAirdrops, setClaimedAirdrops] = useState<AirdropClaim[]>(store.getClaimedAirdrops());
  const [isAirdropLive, setIsAirdropLive] = useState<boolean>(store.getAirdropStatus());

  useEffect(() => {
    // This effect runs only once on initial mount to load user data
    if (!store.getUserProfile()) {
      let isMounted = true;
      let pollCount = 0;
      const maxPolls = 10;

      const initTelegram = () => {
        if (!isMounted) return;

        const tg = window.Telegram?.WebApp;
        if (tg && tg.initDataUnsafe) {
          tg.ready();
          const telegramUser = tg.initDataUnsafe.user;

          const initialProfile: UserProfile = telegramUser
            ? {
                id: telegramUser.id.toString(),
                telegramUsername: telegramUser.username || `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
                profilePictureUrl: telegramUser.photo_url || `https://picsum.photos/seed/${telegramUser.id}/100/100`,
                mainBalance: 12500.75,
                pendingBalance: 750.25,
                isPremium: !!telegramUser.is_premium,
                purchasedBoosts: [],
                isLicenseActive: false,
                completedSocialTasks: { twitter: 'idle', telegram: 'idle', community: 'idle' },
                hasClaimedAirdrop: false,
              }
            : {
                id: '0000',
                telegramUsername: 'telegram_user',
                profilePictureUrl: 'https://picsum.photos/100/100',
                mainBalance: 12500.75,
                pendingBalance: 750.25,
                isPremium: true,
                purchasedBoosts: [],
                isLicenseActive: false,
                completedSocialTasks: { twitter: 'idle', telegram: 'idle', community: 'idle' },
                hasClaimedAirdrop: false,
              };
          
          store.initialize(initialProfile, mockLeaderboard);
          setReferrals(mockReferrals); // Referrals are static for now
        } else if (pollCount < maxPolls) {
          pollCount++;
          setTimeout(initTelegram, 100);
        } else {
          console.log("Telegram WebApp not found, using mock data.");
          if (isMounted) {
            const initialProfile: UserProfile = {
              id: '0000',
              telegramUsername: 'telegram_user',
              profilePictureUrl: 'https://picsum.photos/100/100',
              mainBalance: 12500.75,
              pendingBalance: 750.25,
              isPremium: true,
              purchasedBoosts: [],
              isLicenseActive: false,
              completedSocialTasks: { twitter: 'idle', telegram: 'idle', community: 'idle' },
              hasClaimedAirdrop: false,
            };
            store.initialize(initialProfile, mockLeaderboard);
            setReferrals(mockReferrals);
          }
        }
      };

      initTelegram();
      
      return () => { isMounted = false; };
    }
  }, []);

  useEffect(() => {
    // This effect subscribes to store updates
    const handleUpdate = () => {
      setUserProfile(store.getUserProfile());
      setLeaderboard(store.getLeaderboard());
      setClaimedAirdrops(store.getClaimedAirdrops());
      setIsAirdropLive(store.getAirdropStatus());
    };

    store.subscribe(handleUpdate);
    
    // Initial sync in case data was loaded by another component
    handleUpdate();

    return () => {
      store.unsubscribe(handleUpdate);
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
    // This state is local to the component and doesn't need to be in the store for now
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
    setAirdropStatus 
  };
};

export { useTelegram };
