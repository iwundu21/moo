
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
  onEvent: (eventType: 'viewportChanged', eventHandler: () => void) => void;
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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = () => {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        
        // This event listener can help ensure we re-check when the viewport is ready
        tg.onEvent('viewportChanged', () => {
            if (!isReady) {
                setIsReady(true);
            }
        });

        // Initial check in case it's already ready
        if (tg.initDataUnsafe?.user) {
            setIsReady(true);
        }
      } else {
        // Fallback for development if Telegram script isn't there
        console.log("Telegram WebApp not found, using mock data.");
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
        setIsReady(true); // Ready with mock data
      }
    };

    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
        return () => window.removeEventListener('load', init);
    }
  }, [isReady]);

  useEffect(() => {
    if (isReady) {
      const tg = window.Telegram?.WebApp;
      if (tg && tg.initDataUnsafe?.user) {
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
      }
      
      // Set mock data for other parts of the app
      setLeaderboard(mockLeaderboard);
      setReferrals(mockReferrals);
      setDistributionHistory(mockDistributionHistory);
    }
  }, [isReady]);

  return { userProfile, leaderboard, referrals, distributionHistory };
};

export { useTelegram };
