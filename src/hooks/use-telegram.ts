
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

const useTelegram = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [distributionHistory, setDistributionHistory] = useState<DistributionRecord[]>(mockDistributionHistory);

  const addDistributionRecord = useCallback((record: DistributionRecord) => {
    setDistributionHistory(prevHistory => [record, ...prevHistory]);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initTelegram = () => {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        
        const onReady = () => {
          if (isMounted) {
            if (tg.initDataUnsafe?.user) {
              const telegramUser = tg.initDataUnsafe.user;
              setUserProfile({
                id: telegramUser.id.toString(),
                telegramUsername: telegramUser.username || `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
                profilePictureUrl: telegramUser.photo_url || `https://picsum.photos/seed/${telegramUser.id}/100/100`,
                mainBalance: 12500.75, // Default value, should be fetched from a backend
                pendingBalance: 750.25, // Default value
                isPremium: !!telegramUser.is_premium,
                purchasedBoosts: [], // Default value
                isLicenseActive: false, // Default value
              });
            } else {
               // Fallback for development if user data isn't available
              setUserProfile({
                  id: '0000',
                  telegramUsername: 'telegram_user',
                  profilePictureUrl: 'https://picsum.photos/100/100',
                  mainBalance: 12500.75,
                  pendingBalance: 750.25,
                  isPremium: true,
                  purchasedBoosts: ['2x'],
                  isLicenseActive: true,
              });
            }
            // Set mock data for other parts of the app
            setLeaderboard(mockLeaderboard);
            setReferrals(mockReferrals);
          }
        };

        if (tg.isReady) {
            onReady();
        } else {
            tg.onEvent('mainButtonClicked', onReady); // Using an event that fires after ready
        }
      } else {
        // Fallback for development if Telegram script isn't there
        console.log("Telegram WebApp not found, using mock data.");
        if (isMounted) {
            setUserProfile({
                id: '0000',
                telegramUsername: 'telegram_user',
                profilePictureUrl: 'https://picsum.photos/100/100',
                mainBalance: 12500.75,
                pendingBalance: 750.25,
                isPremium: true,
                purchasedBoosts: ['2x'],
                isLicenseActive: true,
            });
            setLeaderboard(mockLeaderboard);
            setReferrals(mockReferrals);
        }
      }
    };
    
    // The script might take time to load, so we'll poll for it.
    const interval = setInterval(() => {
        if (window.Telegram?.WebApp) {
            clearInterval(interval);
            initTelegram();
        }
    }, 100);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { userProfile, leaderboard, referrals, distributionHistory, addDistributionRecord };
};

export { useTelegram };
