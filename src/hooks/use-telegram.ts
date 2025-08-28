
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { UserProfile, LeaderboardEntry, Referral, DistributionRecord, AirdropClaim } from '@/lib/types';
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

// Store data in variables that persist across hook instances
let globalUserProfile: UserProfile | null = null;
const profileListeners: Set<(profile: UserProfile | null) => void> = new Set();

let globalLeaderboard: LeaderboardEntry[] = [];
const leaderboardListeners: Set<(leaderboard: LeaderboardEntry[]) => void> = new Set();

let globalClaimedAirdrops: AirdropClaim[] = [];
const claimListeners: Set<(claims: AirdropClaim[]) => void> = new Set();

const AIRDROP_STATUS_STORAGE_KEY = 'moo-airdrop-live-status';

const notifyProfileListeners = () => {
    for (const listener of profileListeners) {
      listener(globalUserProfile);
    }
};

const notifyLeaderboardListeners = () => {
    for (const listener of leaderboardListeners) {
      listener([...globalLeaderboard]);
    }
};

const notifyClaimListeners = () => {
    for (const listener of claimListeners) {
      listener([...globalClaimedAirdrops]);
    }
};


const useTelegram = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(globalUserProfile);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(globalLeaderboard);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [distributionHistory, setDistributionHistory] = useState<DistributionRecord[]>(mockDistributionHistory);
  const [claimedAirdrops, setClaimedAirdrops] = useState<AirdropClaim[]>(globalClaimedAirdrops);
  
  // Airdrop status state with proper initialization from localStorage
  const [isAirdropLive, setIsAirdropLive] = useState<boolean>(true);

  useEffect(() => {
    // This effect runs only on the client, after hydration
    const storedValue = window.localStorage.getItem(AIRDROP_STATUS_STORAGE_KEY);
    setIsAirdropLive(storedValue === null ? true : storedValue === 'true');
    
    // Listener for storage events (from other tabs)
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === AIRDROP_STATUS_STORAGE_KEY) {
            const newValue = event.newValue;
            setIsAirdropLive(newValue === null ? true : newValue === 'true');
        }
    };
    window.addEventListener('storage', handleStorageChange);


    // Register listeners for other global state
    const profileListener = (profile: UserProfile | null) => setUserProfile(profile);
    const leaderboardListener = (leaderboard: LeaderboardEntry[]) => setLeaderboard(leaderboard);
    const claimListener = (claims: AirdropClaim[]) => setClaimedAirdrops(claims);
   
    profileListeners.add(profileListener);
    leaderboardListeners.add(leaderboardListener);
    claimListeners.add(claimListener);
   
    // Initial sync with global state on mount
    if (globalUserProfile) {
      setUserProfile(globalUserProfile);
      setLeaderboard(globalLeaderboard);
      setClaimedAirdrops(globalClaimedAirdrops);
    }


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
              hasClaimedAirdrop: false,
            };
          } else {
            globalUserProfile = {
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
          }

          const userInMock = mockLeaderboard.some(u => u.username === globalUserProfile!.telegramUsername);
          globalLeaderboard = [...mockLeaderboard];
          if (!userInMock) {
              globalLeaderboard.push({
                  rank: 0,
                  username: globalUserProfile!.telegramUsername,
                  profilePictureUrl: globalUserProfile!.profilePictureUrl,
                  balance: globalUserProfile!.mainBalance
              });
          }
          globalLeaderboard.sort((a, b) => b.balance - a.balance);
          globalLeaderboard.forEach((user, index) => {
              user.rank = index + 1;
          });
          
          notifyProfileListeners();
          notifyLeaderboardListeners();
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
                purchasedBoosts: [],
                isLicenseActive: false,
                completedSocialTasks: { twitter: 'idle', telegram: 'idle', community: 'idle' },
                hasClaimedAirdrop: false,
            };

            const userInMock = mockLeaderboard.some(u => u.username === globalUserProfile!.telegramUsername);
            globalLeaderboard = [...mockLeaderboard];
            if (!userInMock) {
                globalLeaderboard.push({
                    rank: 0,
                    username: globalUserProfile!.telegramUsername,
                    profilePictureUrl: globalUserProfile!.profilePictureUrl,
                    balance: globalUserProfile!.mainBalance
                });
            }
            globalLeaderboard.sort((a, b) => b.balance - a.balance);
            globalLeaderboard.forEach((user, index) => {
                user.rank = index + 1;
            });
            
            notifyProfileListeners();
            notifyLeaderboardListeners();
            setReferrals(mockReferrals);
          }
        }
      };
      
      initTelegram();

      return () => {
        isMounted = false;
      };
    }

    // Cleanup listeners
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      profileListeners.delete(profileListener);
      leaderboardListeners.delete(leaderboardListener);
      claimListeners.delete(claimListener);
    };
  }, []);

  const setAirdropStatus = useCallback((isLive: boolean) => {
    if (typeof window !== 'undefined') {
        const newValue = String(isLive);
        window.localStorage.setItem(AIRDROP_STATUS_STORAGE_KEY, newValue);
        // Manually update state for the current tab
        setIsAirdropLive(isLive);
        // Dispatch a storage event to notify other tabs
        window.dispatchEvent(new StorageEvent('storage', {
            key: AIRDROP_STATUS_STORAGE_KEY,
            newValue: newValue
        }));
    }
  }, []);

  const addClaimRecord = useCallback((claim: AirdropClaim) => {
    globalClaimedAirdrops.push(claim);
    notifyClaimListeners();
  }, []);

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    if (globalUserProfile) {
      const wasLeaderboardUpdated = 'mainBalance' in updates;
      globalUserProfile = { ...globalUserProfile, ...updates };
      notifyProfileListeners();

      if (wasLeaderboardUpdated) {
        const userInLeaderboardIndex = globalLeaderboard.findIndex(u => u.username === globalUserProfile!.telegramUsername);
        if (userInLeaderboardIndex !== -1) {
            globalLeaderboard[userInLeaderboardIndex].balance = globalUserProfile.mainBalance;
        }
        
        globalLeaderboard.sort((a, b) => b.balance - a.balance);
        globalLeaderboard.forEach((user, index) => {
            user.rank = index + 1;
        });

        notifyLeaderboardListeners();
      }
    }
  }, []);

  const addDistributionRecord = useCallback((record: DistributionRecord) => {
    setDistributionHistory(prevHistory => [record, ...prevHistory]);
  }, []);

  return { userProfile, leaderboard, referrals, distributionHistory, claimedAirdrops, isAirdropLive, addDistributionRecord, updateUserProfile, addClaimRecord, setAirdropStatus };
};

export { useTelegram };
