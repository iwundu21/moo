
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
  first_name?: string;
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
  const [isLoading, setIsLoading] = useState(true);
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
                console.error("Attempted to update a non-existent user profile.");
                return;
            }
            const currentProfile = userDoc.data() as UserProfile;
            const updatedProfile = { ...currentProfile, ...updates };
            transaction.set(userDocRef, updatedProfile);

             if (id === userProfile?.id) {
                // Update local state immediately for responsiveness
                setUserProfile(prev => prev ? { ...prev, ...updates } : null);
            }
        });
    } catch(e) {
        console.error("Transaction failed: ", e);
    }
  }, [userProfile]);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
        setIsLoading(false);
        return;
    }
    
    tg.ready();

    const fetchInitialData = async () => {
        setIsLoading(true);

        const telegramUser = tg.initDataUnsafe?.user;
        if (!telegramUser) {
            setIsLoading(false);
            return;
        }
        
        const userId = telegramUser.id.toString();

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
            const safeUsername = telegramUser.username || `${telegramUser.first_name || 'User'} ${telegramUser.last_name || ''}`.trimEnd();

            currentUserProfile = {
                id: userId,
                telegramUsername: safeUsername,
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
                        const refereeDocRef = doc(db, 'userProfiles', userId);
                        
                        currentUserProfile.referredBy = referrerId;
                        currentUserProfile.mainBalance = (currentUserProfile.mainBalance || 0) + 100;
                        if(currentUserProfile.completedSocialTasks){
                            currentUserProfile.completedSocialTasks.referral = 'completed';
                        }
                        transaction.set(refereeDocRef, currentUserProfile);
                        
                        const referrerProfile = referrerDoc.data() as UserProfile;
                        const newReferrerBalance = (referrerProfile.mainBalance || 0) + 100;
                        transaction.update(referrerDoc.ref, { mainBalance: newReferrerBalance });

                        const referralRecordRef = doc(collection(db, 'userProfiles', referrerId, 'referrals'));
                        transaction.set(referralRecordRef, { 
                            username: currentUserProfile.telegramUsername, 
                            profilePictureUrl: currentUserProfile.profilePictureUrl,
                            timestamp: new Date()
                        });
                    });
                }
            }
        }

        setUserProfile(currentUserProfile);
        
        // Fetch collections for the user
        const referralsCol = collection(db, 'userProfiles', userId, 'referrals');
        const referralSnapshot = await getDocs(query(referralsCol, orderBy('timestamp', 'desc')));
        setReferrals(referralSnapshot.docs.map(d => d.data() as Referral));

        const distributionHistoryCol = collection(db, 'userProfiles', userId, 'distributionHistory');
        const distributionSnapshot = await getDocs(query(distributionHistoryCol, orderBy('timestamp', 'desc')));
        setDistributionHistory(distributionSnapshot.docs.map(d => d.data() as DistributionRecord));

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
        
        const claimsQuery = query(collection(db, 'airdropClaims'), orderBy('timestamp', 'desc'));
        const claimsSnapshot = await getDocs(claimsQuery);
        setClaimedAirdrops(claimsSnapshot.docs.map(d => d.data() as AirdropClaim));

        setIsLoading(false);
    };

    fetchInitialData().catch(console.error);
  }, []);

  const redeemReferralCode = useCallback(async (referralCode: string): Promise<{success: boolean, message: string, referrerId?: string}> => {
    if (!userProfile) return {success: false, message: "User profile not loaded."};
    
    const upperCaseCode = referralCode.trim().toUpperCase();

    if (upperCaseCode === userProfile.referralCode) {
        return {success: false, message: "You cannot redeem your own referral code."};
    }
    
    if (userProfile.referredBy) {
        return {success: false, message: "You have already redeemed a referral code."};
    }

    const q = query(collection(db, 'userProfiles'), where("referralCode", "==", upperCaseCode));
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
            const currentProfile = refereeDoc.data();

            if (!refereeDoc.exists() || (currentProfile && currentProfile.referredBy)) {
                throw new Error("User has already redeemed a code.");
            }

            const newRefereeBalance = (currentProfile?.mainBalance || 0) + 100;
            transaction.update(userDocRef, { 
                referredBy: referrerId,
                mainBalance: newRefereeBalance,
                'completedSocialTasks.referral': 'completed'
            });

            const newReferrerBalance = (referrerProfile.mainBalance || 0) + 100;
            transaction.update(referrerDoc.ref, { mainBalance: newReferrerBalance });

            const referralRecordRef = doc(collection(db, 'userProfiles', referrerId, 'referrals'));
            transaction.set(referralRecordRef, { 
                username: userProfile.telegramUsername, 
                profilePictureUrl: userProfile.profilePictureUrl,
                timestamp: new Date()
            });
        });
        
        setUserProfile(prev => prev ? {
            ...prev,
            referredBy: referrerId, 
            mainBalance: prev.mainBalance + 100,
            completedSocialTasks: { ...(prev.completedSocialTasks || {}), referral: 'completed' }
        } : null);
        
        return {success: true, message: "Referral code redeemed successfully!", referrerId: referrerId};
    } catch (e: any) {
        console.error("Referral redeem transaction failed: ", e);
        return {success: false, message: e.message || "An error occurred during the transaction."};
    }

  }, [userProfile]);

  const addClaimRecord = useCallback(async (claim: AirdropClaim) => {
    const claimDocRef = doc(db, 'airdropClaims', claim.userId);
    const newClaim = { ...claim, timestamp: new Date() };
    await setDoc(claimDocRef, newClaim);
    setClaimedAirdrops(prev => [...prev.filter(c => c.userId !== claim.userId), newClaim]);
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
    await setDoc(distDocRef, { ...record, timestamp: record.timestamp.toISOString() });
    setDistributionHistory(prevHistory => [{ ...record, timestamp: record.timestamp.toISOString() }, ...prevHistory]);
  }, [userProfile]);
  
  const setAirdropStatus = useCallback(async (isLive: boolean) => {
    const settingsDocRef = doc(db, 'settings', 'app');
    await setDoc(settingsDocRef, { isAirdropLive: isLive }, { merge: true });
    setIsAirdropLive(isLive);
  }, []);

  return { 
    isLoading,
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
    redeemReferralCode
  };
};

export { useTelegram };
