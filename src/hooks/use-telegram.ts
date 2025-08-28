
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { UserProfile, LeaderboardEntry, Referral, DistributionRecord } from '@/lib/types';
import { mockLeaderboard, mockReferrals, mockDistributionHistory } from '@/lib/data';

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

// Store the profile in a variable that persists across hook instances
let globalUserProfile: UserProfile | null = null;
const profileListeners: Set<(profile: UserProfile | null) => void> = new Set();

const useTelegram = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(globalUserProfile);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [distributionHistory, setDistributionHistory] = useState<DistributionRecord[]>(mockDistributionHistory);

  const notifyListeners = () => {
    for (const listener of profileListeners) {
      listener(globalUserProfile);
    }
  };

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    if (globalUserProfile) {
      globalUserProfile = { ...globalUserProfile, ...updates };
      notifyListeners();
    }
  }, []);

  const addDistributionRecord = useCallback((record: DistributionRecord) => {
    setDistributionHistory(prevHistory => [record, ...prevHistory]);
  }, []);

  useEffect(() => {
    // Register listener
    const listener = (profile: UserProfile | null) => setUserProfile(profile);
    profileListeners.add(listener);

    // Initial load logic should only run once
    if (!globalUserProfile) {
      let isMounted = true;
      let pollCount = 0;
      const maxPolls = 10; // Poll for 1 second max

      const initTelegram = () => {
        if (!isMounted) return;

        const tg = window.Telegram?.WebApp;
        if (tg && tg.initDataUnsafe) {
          tg.ready();
          
          if (tg.initDataUnsafe.user) {
            const telegramUser = tg.initDataUnsafe.user;
            globalUserProfile = {
              id: telegramUser.id.toString(),
              telegramUsername: telegramUser.username || `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
              profilePictureUrl: telegramUser.photo_url || `https://picsum.photos/seed/${telegramUser.id}/100/100`,
              mainBalance: 12500.75,
              pendingBalance: 750.25,
              isPremium: !!telegramUser.is_premium,
              purchasedBoosts: [],
              isLicenseActive: false,
              completedSocialTasks: { twitter: 'idle', telegram: 'idle', community: 'idle' },
            };
          } else {
             // Fallback for development if user data isn't available
            globalUserProfile = {
                id: '0000',
                telegramUsername: 'telegram_user',
                profilePictureUrl: 'https://picsum.photos/100/100',
                mainBalance: 12500.75,
                pendingBalance: 750.25,
                isPremium: true,
                purchasedBoosts: ['2x'],
                isLicenseActive: false, // Start as inactive
                completedSocialTasks: { twitter: 'idle', telegram: 'idle', community: 'idle' },
            };
          }
          notifyListeners();
          setLeaderboard(mockLeaderboard);
          setReferrals(mockReferrals);

        } else if (pollCount < maxPolls) {
          pollCount++;
          setTimeout(initTelegram, 100);
        } else {
          console.log("Telegram WebApp not found, using mock data.");
          if (isMounted) {
            globalUserProfile = {
                id: '0000',
                telegramUsername: 'telegram_user',
                profilePictureUrl: 'https://picsum.photos/100/100',
                mainBalance: 12500.75,
                pendingBalance: 750.25,
                isPremium: true,
                purchasedBoosts: ['2x'],
                isLicenseActive: false, // Start as inactive
                completedSocialTasks: { twitter: 'idle', telegram: 'idle', community: 'idle' },
            };
            notifyListeners();
            setLeaderboard(mockLeaderboard);
            setReferrals(mockReferrals);
          }
        }
      };
      
      initTelegram();

      return () => {
        isMounted = false;
      };
    }

    // Cleanup listener
    return () => {
      profileListeners.delete(listener);
    };
  }, []);

  return { userProfile, leaderboard, referrals, distributionHistory, addDistributionRecord, updateUserProfile };
};

export { useTelegram };

    
