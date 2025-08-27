
'use client';

import { useEffect, useState } from 'react';
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
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function useTelegram() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [distributionHistory, setDistributionHistory] = useState<DistributionRecord[]>([]);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    
    if (tg && tg.initDataUnsafe.user) {
      // Telegram data is available
      tg.ready();
      const telegramUser = tg.initDataUnsafe.user;
      
      setUserProfile({
        id: telegramUser.id.toString(),
        telegramUsername: telegramUser.username || `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
        profilePictureUrl: telegramUser.photo_url || `https://picsum.photos/seed/${telegramUser.id}/100/100`,
        mainBalance: 12500.75, // Default value, should be fetched from a backend
        pendingBalance: 750.25, // Default value
        isPremium: !!telegramUser.is_premium,
        purchasedBoosts: ['2x'], // Default value
        isLicenseActive: false, // Default value
      });
      
    } else {
      // Fallback for development outside Telegram
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
    setDistributionHistory(mockDistributionHistory);
    
  }, []);

  return { userProfile, leaderboard, referrals, distributionHistory };
}
