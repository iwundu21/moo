
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { UserProfile, LeaderboardEntry, Referral, DistributionRecord, AirdropClaim } from '@/lib/types';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  runTransaction,
  where,
  documentId
} from 'firebase/firestore';

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
  openInvoice: (url: string, callback: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void) => void;
  close: () => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

// Function to generate a unique referral code
const generateReferralCode = async (): Promise<string> => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let isUnique = false;

    while(!isUnique) {
        code = 'M';
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const q = query(collection(db, "userProfiles"), where("referralCode", "==", code));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            isUnique = true;
        }
    }
    return code!;
};


const useTelegram = () => {
  const [isClient, setIsClient] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [claimedAirdrops, setClaimedAirdrops] = useState<AirdropClaim[]>([]);
  const [isAirdropLive, setIsAirdropLive] = useState<boolean>(true);
  const [distributionHistory, setDistributionHistory] = useState<DistributionRecord[]>([]);

  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>, userIdToUpdate?: string) => {
    const id = userIdToUpdate || userProfile?.id;
    if (!id) return;
    
    const userDocRef = doc(db, 'userProfiles', id);
    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw "Document does not exist!";
            }
            const updatedProfile = { ...userDoc.data(), ...updates };
            transaction.set(userDocRef, updatedProfile);
        });
        if (id === userProfile?.id) {
            setUserProfile(prev => prev ? { ...prev, ...updates } : null);
        }
    } catch(e) {
        console.error("Transaction failed: ", e);
    }
  }, [userProfile]);

  useEffect(() => {
    setIsClient(true);
    const tg = window.Telegram?.WebApp;

    if (!tg?.initDataUnsafe?.user) {
        return;
    }
    tg.ready();

    const telegramUser = tg.initDataUnsafe.user;
    const userId = telegramUser.id.toString();

    const fetchInitialData = async () => {
        // Fetch global settings
        const settingsDocRef = doc(db, 'settings', 'app');
        const settingsDoc = await getDoc(settingsDocRef);
        const settingsData = settingsDoc.data() || {};
        setIsAirdropLive(settingsData.isAirdropLive === undefined ? true : settingsData.isAirdropLive);

        // Fetch user profile
        const userDocRef = doc(db, 'userProfiles', userId);
        let userDoc = await getDoc(userDocRef);
        let currentUserProfile: UserProfile;

        if (!userDoc.exists()) {
            const newReferralCode = await generateReferralCode();
            currentUserProfile = {
                id: userId,
                telegramUsername: telegramUser.username || `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
                profilePictureUrl: telegramUser.photo_url || `https://picsum.photos/seed/${userId}/100/100`,
                mainBalance: 0,
                pendingBalance: 0,
                isPremium: !!telegramUser.is_premium,
                purchasedBoosts: [],
                isLicenseActive: false,
                completedSocialTasks: { twitter: 'idle', telegram: 'idle', community: 'idle', referral: 'idle' },
                hasClaimedAirdrop: false,
                referredBy: null,
                referralCode: newReferralCode
            };
            await setDoc(userDocRef, currentUserProfile);
        } else {
             currentUserProfile = userDoc.data() as UserProfile;
             if (!currentUserProfile.referralCode) {
                 const newReferralCode = await generateReferralCode();
                 currentUserProfile.referralCode = newReferralCode;
                 await setDoc(userDocRef, currentUserProfile, { merge: true });
             }
        }
        setUserProfile(currentUserProfile);
        
        // Handle referral from URL on first login
        const startParam = tg.initDataUnsafe.start_param;
        if (startParam && startParam.startsWith('ref') && !currentUserProfile.referredBy) {
            const referrerCode = startParam.substring(3);
            const q = query(collection(db, 'userProfiles'), where("referralCode", "==", referrerCode));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const referrerDoc = querySnapshot.docs[0];
                const referrerId = referrerDoc.id;
                
                if (referrerId !== userId) {
                    await runTransaction(db, async (transaction) => {
                        // 1. Give referee 100 MOO
                        const newRefereeBalance = (currentUserProfile.mainBalance || 0) + 100;
                        transaction.update(userDocRef, { 
                            referredBy: referrerId,
                            mainBalance: newRefereeBalance,
                            'completedSocialTasks.referral': 'completed'
                        });
                        
                        // 2. Give referrer 100 MOO
                        const referrerProfile = referrerDoc.data() as UserProfile;
                        const newReferrerBalance = (referrerProfile.mainBalance || 0) + 100;
                        transaction.update(referrerDoc.ref, { mainBalance: newReferrerBalance });

                        // 3. Add to referrer's referral list
                        const referralRecordRef = doc(collection(db, 'userProfiles', referrerId, 'referrals'));
                        transaction.set(referralRecordRef, { 
                            username: currentUserProfile.telegramUsername, 
                            profilePictureUrl: currentUserProfile.profilePictureUrl,
                            timestamp: new Date()
                        });
                    });
                     // Re-fetch user profile to get the latest data after referral
                    userDoc = await getDoc(userDocRef);
                    setUserProfile(userDoc.data() as UserProfile);
                }
            }
        }
        
        // Fetch referrals
        const referralsCol = collection(db, 'userProfiles', userId, 'referrals');
        const referralSnapshot = await getDocs(query(referralsCol, orderBy('timestamp', 'desc')));
        setReferrals(referralSnapshot.docs.map(d => d.data() as Referral));

        // Fetch leaderboard
        const leaderboardQuery = query(collection(db, 'userProfiles'), orderBy('mainBalance', 'desc'), limit(100));
        const leaderboardSnapshot = await getDocs(leaderboardQuery);
        setLeaderboard(leaderboardSnapshot.docs.map((doc, index) => {
            const data = doc.data();
            return {
                rank: index + 1,
                username: data.telegramUsername,
                balance: data.mainBalance,
                profilePictureUrl: data.profilePictureUrl
            }
        }));
        
        // Fetch airdrop claims (if admin)
        const claimsQuery = query(collection(db, 'airdropClaims'), orderBy('timestamp', 'desc'));
        const claimsSnapshot = await getDocs(claimsQuery);
        setClaimedAirdrops(claimsSnapshot.docs.map(d => d.data() as AirdropClaim));
    };

    fetchInitialData();
  }, []);

  const redeemReferralCode = useCallback(async (referralCode: string): Promise<{success: boolean, message: string, referrerId?: string}> => {
    if (!userProfile) return {success: false, message: "User profile not loaded."};

    if (referralCode === userProfile.referralCode) {
        return {success: false, message: "You cannot redeem your own referral code."};
    }
    
    if (userProfile.referredBy) {
        return {success: false, message: "You have already redeemed a referral code."};
    }

    const q = query(collection(db, 'userProfiles'), where("referralCode", "==", referralCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return {success: false, message: "Invalid referral code. User not found."};
    }

    const referrerDoc = querySnapshot.docs[0];
    const referrerId = referrerDoc.id;
    const referrerProfile = referrerDoc.data() as UserProfile;

    if (referrerId === userProfile.id) {
        return {success: false, message: "You cannot redeem your own referral code."};
    }

    try {
        await runTransaction(db, async (transaction) => {
            const userDocRef = doc(db, 'userProfiles', userProfile.id);
            const refereeDoc = await transaction.get(userDocRef);

            if (!refereeDoc.exists() || refereeDoc.data().referredBy) {
                throw new Error("User has already redeemed a code.");
            }

            // 1. Give referee 100 MOO
            const newRefereeBalance = (refereeDoc.data().mainBalance || 0) + 100;
            transaction.update(userDocRef, { 
                referredBy: referrerId,
                mainBalance: newRefereeBalance,
                'completedSocialTasks.referral': 'completed'
            });

            // 2. Give referrer 100 MOO
            const newReferrerBalance = (referrerProfile.mainBalance || 0) + 100;
            transaction.update(referrerDoc.ref, { mainBalance: newReferrerBalance });

            // 3. Add to referrer's referral list
            const referralRecordRef = doc(collection(db, 'userProfiles', referrerId, 'referrals'));
            transaction.set(referralRecordRef, { 
                username: userProfile.telegramUsername, 
                profilePictureUrl: userProfile.profilePictureUrl,
                timestamp: new Date()
            });
        });
        
        // Update local state after successful transaction
        updateUserProfile({ 
            referredBy: referrerId, 
            mainBalance: userProfile.mainBalance + 100,
            completedSocialTasks: { ...userProfile.completedSocialTasks, referral: 'completed' }
        });
        
        // Add to local referrals list for the referrer (if they are the current user, though unlikely)
        if (referrerId === userProfile.id) {
           setReferrals(prev => [{username: userProfile.telegramUsername, profilePictureUrl: userProfile.profilePictureUrl}, ...prev]);
        }
        
        return {success: true, message: "Referral code redeemed successfully!", referrerId: referrerId};
    } catch (e: any) {
        console.error("Referral redeem transaction failed: ", e);
        return {success: false, message: e.message || "An error occurred during the transaction."};
    }

  }, [userProfile, updateUserProfile]);

  const addClaimRecord = useCallback(async (claim: AirdropClaim) => {
    const claimDocRef = doc(db, 'airdropClaims', claim.userId);
    await setDoc(claimDocRef, { ...claim, timestamp: new Date() });
    setClaimedAirdrops(prev => [...prev, claim]);
  }, []);

  const clearAllClaims = useCallback(async () => {
    const claimsQuery = query(collection(db, 'airdropClaims'));
    const claimsSnapshot = await getDocs(claimsQuery);
    const batch = writeBatch(db);
    claimsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    setClaimedAirdrops([]);
  }, []);

  const addDistributionRecord = useCallback(async (record: DistributionRecord) => {
    if (!userProfile) return;
    const distDocRef = doc(collection(db, 'userProfiles', userProfile.id, 'distributionHistory'));
    await setDoc(distDocRef, record);
    setDistributionHistory(prevHistory => [record, ...prevHistory]);
  }, [userProfile]);
  
  const setAirdropStatus = useCallback(async (isLive: boolean) => {
    const settingsDocRef = doc(db, 'settings', 'app');
    await setDoc(settingsDocRef, { isAirdropLive: isLive }, { merge: true });
    setIsAirdropLive(isLive);
  }, []);

  return { 
    userProfile, 
    leaderboard, 
    referrals, 
    distributionHistory, 
    claimedAirdrops,
    isAirdropLive,
    setAirdropStatus,
    clearAllClaims,
    addDistributionRecord, 
    updateUserProfile, 
    addClaimRecord,
    redeemReferralCode, 
    isClient
  };
};

export { useTelegram };
