
'use client';

import { useEffect, useState } from 'react';
import type { UserProfile, LeaderboardEntry, Referral, DistributionRecord } from '@/lib/types';
import { mockLeaderboard, mockReferrals, mockDistributionHistory } from '@/lib/data';

// This is the type for the user object from Telegram Web App API
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code: string;
  is_premium?: boolean;
  photo_url?: string;
}

// This is the type for the WebApp object from Telegram
interface TelegramWebApp {
  initDataUnsafe: {
    user?: TelegramUser;
  };
  // Add other WebApp properties and methods if needed
}

// Extend the Window interface
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
    if (tg) {
      const telegramUser = tg.initDataUnsafe?.user;
      
      if (telegramUser) {
        // Here we map the Telegram user data to our UserProfile type.
        // For balances and other app-specific data, we'd normally fetch them from a backend.
        // For now, we'll use some default values.
        setUserProfile({
          id: telegramUser.id.toString(),
          telegramUsername: telegramUser.username || `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
          profilePictureUrl: telegramUser.photo_url || `https://picsum.photos/seed/${telegramUser.id}/100/100`,
          mainBalance: 12500.75, // Default value
          pendingBalance: 750.25, // Default value
          isPremium: !!telegramUser.is_premium,
          purchasedBoosts: ['2x'], // Default value
          isLicenseActive: false, // Default value
        });
      } else {
         // Fallback for when user data is not available (e.g. running outside Telegram)
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

      // For other data, we still use mock data as we don't have a backend.
      setLeaderboard(mockLeaderboard);
      setReferrals(mockReferrals);
      setDistributionHistory(mockDistributionHistory);
    }
  }, []);

  return { userProfile, leaderboard, referrals, distributionHistory };
}
