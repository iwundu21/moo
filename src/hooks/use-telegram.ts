

'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import type { UserProfile, LeaderboardEntry, Referral, AirdropClaim, ClaimRecord, AppSettings } from '@/lib/types';
import { db, functions } from '@/lib/firebase';
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
  getCountFromServer,
  updateDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

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
  const [claimHistory, setClaimHistory] = useState<ClaimRecord[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({ isAirdropLive: true, airdropEndDate: null });
  const [totalUserCount, setTotalUserCount] = useState<number>(0);
  const [totalMooGenerated, setTotalMooGenerated] = useState<number>(0);
  const [totalLicensedUsers, setTotalLicensedUsers] = useState<number>(0);
  const [airdropClaims, setAirdropClaims] = useState<AirdropClaim[]>([]);
  const isFetching = useRef(false);

  const isAirdropClaimable = useMemo(() => {
    if (!appSettings.isAirdropLive) return false;
    if (appSettings.airdropEndDate && new Date() > appSettings.airdropEndDate) return false;
    return true;
  }, [appSettings]);


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
            
            // Ensure completedSocialTasks is properly merged
            const newCompletedSocialTasks = { 
                ...(currentProfile.completedSocialTasks || {}), 
                ...(updates.completedSocialTasks || {}) 
            };
            
            const updatedProfileData = { ...currentProfile, ...updates, completedSocialTasks: newCompletedSocialTasks };
            transaction.set(userDocRef, updatedProfileData, { merge: true });

             if (id === userProfile?.id) {
                setUserProfile(prev => prev ? updatedProfileData : null);
            }
        });
    } catch(e) {
        console.error("Transaction failed: ", e);
    }
  }, [userProfile]);

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
            
            transaction.update(userDocRef, { 
                referredBy: referrerId,
                'completedSocialTasks.referral': 'completed'
            });
            
            const newReferrerBalance = (referrerProfile.mainBalance || 0) + 100;
            const newReferrerLifetimeBalance = (referrerProfile.lifetimeBalance || 0) + 100;
            transaction.update(referrerDoc.ref, { 
              mainBalance: newReferrerBalance,
              lifetimeBalance: newReferrerLifetimeBalance
            });

            const referralRecordRef = doc(collection(db, 'userProfiles', referrerId, 'referrals'));
            transaction.set(referralRecordRef, { 
                username: userProfile.telegramUsername, 
                profilePictureUrl: userProfile.profilePictureUrl,
                timestamp: new Date()
            });
        });
        
        await updateUserProfile({ 
            referredBy: referrerId, 
            completedSocialTasks: { ...(userProfile.completedSocialTasks), referral: 'completed' }
        });
        
        return {success: true, message: "Referral code redeemed successfully!", referrerId: referrerId};
    } catch (e: any) {
        console.error("Referral redeem transaction failed: ", e);
        return {success: false, message: e.message || "An error occurred during the transaction."};
    }

  }, [userProfile, updateUserProfile]);
  
  const fetchAdminStats = useCallback(async () => {
    const allUsersCol = collection(db, 'userProfiles');
    
    try {
        const [
            allUsersSnapshot,
            userCountSnapshot
        ] = await Promise.all([
            getDocs(query(allUsersCol)),
            getCountFromServer(allUsersCol)
        ]);
        
        setTotalUserCount(userCountSnapshot.data().count);
        
        let totalMoo = 0;
        let licensedUsers = 0;
        allUsersSnapshot.forEach(doc => {
          const data = doc.data() as UserProfile;
          totalMoo += data.mainBalance || 0;
          if (data.isLicenseActive) {
            licensedUsers++;
          }
        });
        setTotalMooGenerated(totalMoo);
        setTotalLicensedUsers(licensedUsers);

    } catch (error) {
        console.error("Error fetching admin stats:", error);
    }
  }, []);
  
  const claimPendingBalance = useCallback(async (): Promise<{success: boolean; message?: string; newMainBalance?: number; claimedAmount?: number;}> => {
    if (!userProfile) return { success: false, message: "User not found." };
    const { id, pendingBalance } = userProfile;
    if (pendingBalance <= 0) return { success: false, message: "No pending balance to claim." };

    const userDocRef = doc(db, 'userProfiles', id);
    const claimHistoryRef = doc(collection(db, 'userProfiles', id, 'claimHistory'));

    try {
      let newMainBalance: number | undefined;
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) {
          throw new Error("User does not exist!");
        }
        const currentData = userDoc.data() as UserProfile;
        const currentPending = currentData.pendingBalance || 0;
        
        if (currentPending <= 0) {
            newMainBalance = currentData.mainBalance;
            return;
        }

        newMainBalance = (currentData.mainBalance || 0) + currentPending;
        const newLifetimeBalance = (currentData.lifetimeBalance || 0) + currentPending;
        transaction.update(userDocRef, {
          mainBalance: newMainBalance,
          pendingBalance: 0,
          lifetimeBalance: newLifetimeBalance
        });

        transaction.set(claimHistoryRef, {
            amount: currentPending,
            timestamp: new Date()
        });
      });

      if (newMainBalance !== undefined) {
        setUserProfile(prev => prev ? { ...prev, mainBalance: newMainBalance!, pendingBalance: 0, lifetimeBalance: (prev.lifetimeBalance || 0) + pendingBalance } : null);
        const newRecord: ClaimRecord = { id: claimHistoryRef.id, amount: pendingBalance, timestamp: new Date() };
        setClaimHistory(prev => [newRecord, ...prev]);
        return { success: true, newMainBalance, claimedAmount: pendingBalance };
      }
      return { success: false, message: "Claim was not processed." };

    } catch (error) {
      console.error("Claim pending balance transaction failed: ", error);
      return { success: false, message: "An error occurred while claiming." };
    }
  }, [userProfile]);
  
  const fetchInitialData = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);

    const tg = window.Telegram?.WebApp;
    if (!tg) {
        setIsLoading(false);
        isFetching.current = false;
        return;
    }

    if (!tg.isReady) {
        tg.ready();
    }

    const telegramUser = tg.initDataUnsafe.user;
    if (!telegramUser) {
        setIsLoading(false);
        isFetching.current = false;
        return;
    }

    const userId = telegramUser.id.toString();
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
            lifetimeBalance: 0,
            pendingBalance: 0,
            isPremium: !!telegramUser.is_premium,
            purchasedBoosts: [],
            isLicenseActive: false,
            completedSocialTasks: { twitter: 'idle', telegram: 'idle', community: 'idle', referral: 'idle' },
            hasClaimedAirdrop: false,
            referredBy: null,
            referralCode: newReferralCode,
            airdropClaimedAmount: 0,
        };
        await setDoc(userDocRef, currentUserProfile);
    } else {
         currentUserProfile = userDoc.data() as UserProfile;
         if (!currentUserProfile.referralCode) {
             const newReferralCode = await generateReferralCode();
             currentUserProfile.referralCode = newReferralCode;
             await updateDoc(userDocRef, { referralCode: newReferralCode });
         }
         if (currentUserProfile.lifetimeBalance === undefined) {
            currentUserProfile.lifetimeBalance = currentUserProfile.mainBalance + (currentUserProfile.airdropClaimedAmount || 0);
            await updateDoc(userDocRef, { lifetimeBalance: currentUserProfile.lifetimeBalance });
         }
    }
    
    setUserProfile(currentUserProfile);
    
    const settingsDocRef = doc(db, 'settings', 'app');
    const allUsersQuery = query(collection(db, 'userProfiles'), orderBy('lifetimeBalance', 'desc'));
    const referralsQuery = query(collection(db, 'userProfiles', userId, 'referrals'), orderBy('timestamp', 'desc'));
    const claimHistoryQuery = query(collection(db, 'userProfiles', userId, 'claimHistory'), orderBy('timestamp', 'desc'), limit(20));
    const allClaimsQuery = query(collection(db, 'airdropClaims'), orderBy('timestamp', 'desc'));

    const [
        settingsDoc,
        allUsersSnapshot,
        referralsSnapshot,
        claimHistorySnapshot,
        claimsSnapshot,
    ] = await Promise.all([
        getDoc(settingsDocRef),
        getDocs(allUsersQuery),
        getDocs(referralsQuery),
        getDocs(claimHistoryQuery),
        getDocs(allClaimsQuery),
    ]);

    if (settingsDoc.exists()) {
        const settingsData = settingsDoc.data();
        setAppSettings({
            isAirdropLive: settingsData.isAirdropLive === undefined ? true : settingsData.isAirdropLive,
            airdropEndDate: settingsData.airdropEndDate ? (settingsData.airdropEndDate as Timestamp).toDate() : null
        });
    }

    setTotalUserCount(allUsersSnapshot.size);
    
    const leaderboardData = allUsersSnapshot.docs.map((doc, index) => {
        const data = doc.data();
        return {
            rank: index + 1,
            username: data.telegramUsername,
            balance: data.lifetimeBalance || data.mainBalance,
            profilePictureUrl: data.profilePictureUrl,
            isPremium: data.isPremium || false
        }
    });
    setLeaderboard(leaderboardData);

    const referralsData = referralsSnapshot.docs.map(d => {
         const data = d.data();
         const timestamp = data.timestamp && typeof data.timestamp.toDate === 'function' 
            ? data.timestamp.toDate() 
            : new Date(data.timestamp);
        return { ...data, timestamp } as Referral;
    });
    setReferrals(referralsData);
    
    const claimHistoryData = claimHistorySnapshot.docs.map(d => {
        const data = d.data();
        const timestamp = data.timestamp && typeof data.timestamp.toDate === 'function' 
           ? data.timestamp.toDate() 
           : new Date(data.timestamp);
       return { id: d.id, ...data, timestamp } as ClaimRecord;
    });
    setClaimHistory(claimHistoryData);

    const allUsersMap = new Map(allUsersSnapshot.docs.map(doc => [doc.id, doc.data() as UserProfile]));
    const claimsData = claimsSnapshot.docs.map((d) => {
        const data = d.data() as AirdropClaim;
        const userData = allUsersMap.get(data.userId);
        return {
            ...data,
            isPremium: userData?.isPremium || false,
            timestamp: (data.timestamp as unknown as Timestamp).toDate(),
        } as AirdropClaim;
    });
    setAirdropClaims(claimsData);

    setIsLoading(false);
    isFetching.current = false;
  }, []);

  useEffect(() => {
    fetchInitialData().catch(console.error);
  }, [fetchInitialData]);

  // Separate useEffect to handle referral code from start_param after profile is loaded
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg || !userProfile || userProfile.referredBy) {
      return;
    }

    const startParam = tg.initDataUnsafe.start_param;
    if (startParam && startParam.startsWith('ref')) {
      const referrerCode = startParam.substring(3);
      if (referrerCode !== userProfile.referralCode) {
          redeemReferralCode(referrerCode).catch(console.error);
      }
    }
  }, [userProfile, redeemReferralCode]);

  const addClaimRecord = useCallback(async (claim: Omit<AirdropClaim, 'timestamp'> & { timestamp: Date }) => {
    const claimDocRef = doc(db, 'airdropClaims', claim.userId);
    const newClaim = { ...claim, timestamp: new Date(), walletAddress: claim.walletAddress || '' };
    if (newClaim.walletAddress) {
        await setDoc(claimDocRef, newClaim, { merge: true });
    }
  }, []);

  const updateClaimStatus = useCallback(async (userId: string, status: 'distributed', walletAddress: string, amount: number) => {
    const claimDocRef = doc(db, "airdropClaims", userId);
    const userDocRef = doc(db, "userProfiles", userId);
    
    const batch = writeBatch(db);
    batch.update(claimDocRef, { status: status });
    batch.update(userDocRef, { airdropStatus: status, walletAddress: walletAddress });
    
    await batch.commit();

  }, []);
  
  const batchUpdateClaimStatuses = useCallback(async (claims: AirdropClaim[]) => {
    const batch = writeBatch(db);
    claims.forEach(claim => {
        const claimDocRef = doc(db, "airdropClaims", claim.userId);
        const userDocRef = doc(db, "userProfiles", claim.userId);
        batch.update(claimDocRef, { status: 'distributed' });
        batch.update(userDocRef, { airdropStatus: 'distributed', walletAddress: claim.walletAddress });
    });
    await batch.commit();
  }, []);


  const clearAllClaims = useCallback(async () => {
    const claimsQuery = query(collection(db, 'airdropClaims'));
    const claimsSnapshot = await getDocs(claimsQuery);
    
    if (claimsSnapshot.empty) {
        return;
    }

    const batch = writeBatch(db);

    for (const claimDoc of claimsSnapshot.docs) {
        const claimData = claimDoc.data() as AirdropClaim;
        const userDocRef = doc(db, 'userProfiles', claimData.userId);

        try {
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data() as UserProfile;
                const restoredBalance = (userData.mainBalance || 0) + claimData.amount;
                
                batch.update(userDocRef, {
                    mainBalance: restoredBalance,
                    hasClaimedAirdrop: false,
                    airdropStatus: 'no-claim',
                    walletAddress: '',
                    airdropClaimedAmount: 0,
                });
            }
        } catch (error) {
            console.error(`Could not find or update user ${claimData.userId}`, error);
            // Decide if you want to continue or stop the batch on error.
            // For this case, we'll continue and just log the error.
        }
        
        batch.delete(claimDoc.ref);
    }
    
    await batch.commit();
  }, []);
  
  const setAirdropStatus = useCallback(async (isLive: boolean) => {
    const settingsDocRef = doc(db, 'settings', 'app');
    await updateDoc(settingsDocRef, { isAirdropLive: isLive });
    setAppSettings(prev => ({ ...prev, isAirdropLive: isLive }));
  }, []);

  const setAirdropEndDate = useCallback(async (endDate: Date | null) => {
    const settingsDocRef = doc(db, 'settings', 'app');
    await updateDoc(settingsDocRef, { airdropEndDate: endDate });
    setAppSettings(prev => ({ ...prev, airdropEndDate: endDate }));
  }, []);
  
  const deleteUser = useCallback(async (userId: string) => {
    if (!userId) return;
    const userDocRef = doc(db, 'userProfiles', userId);
    const claimDocRef = doc(db, 'airdropClaims', userId);

    try {
      await deleteDoc(userDocRef);
      // It's possible a user exists without a claim, so we check before deleting.
      const claimDoc = await getDoc(claimDocRef);
      if (claimDoc.exists()) {
        await deleteDoc(claimDocRef);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }, []);

  const verifyTelegramTask = async (channelId: string): Promise<{ isMember: boolean, message?: string }> => {
    if (!userProfile) return { isMember: false, message: 'User profile not loaded.' };
    
    const checkTelegramMembership = httpsCallable<{ userId: string, channelId: string }, { isMember: boolean, reason?: string }>(functions, 'checkTelegramMembership');

    try {
        const result = await checkTelegramMembership({ userId: userProfile.id, channelId });
        return { isMember: result.data.isMember, message: result.data.reason };
    } catch (error: any) {
        console.error("Firebase Functions call failed:", error);
        return { isMember: false, message: error.message || 'Failed to connect to verification service.' };
    }
  };

  const processPayment = useCallback(async (
    amount: number,
    title: string,
    description: string,
    payload: string,
    callback: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void
  ) => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      callback('failed');
      return;
    }

    try {
      const createPaymentInvoice = httpsCallable<any, { invoiceUrl: string }>(functions, 'createPaymentInvoice');
      const result = await createPaymentInvoice({ amount, payload, title, description });
      const invoiceUrl = result.data.invoiceUrl;

      if (invoiceUrl) {
        tg.openInvoice(invoiceUrl, callback);
      } else {
        callback('failed');
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      callback('failed');
    }
  }, []);

  return { 
    isLoading,
    userProfile, 
    leaderboard, 
    referrals,
    claimHistory,
    appSettings,
    airdropClaims,
    isAirdropClaimable,
    totalUserCount,
    totalMooGenerated,
    totalLicensedUsers,
    setAirdropStatus,
    setAirdropEndDate,
    clearAllClaims,
    updateUserProfile, 
    addClaimRecord,
    updateClaimStatus,
    batchUpdateClaimStatuses,
    redeemReferralCode,
    fetchAdminStats,
    deleteUser,
    claimPendingBalance,
    verifyTelegramTask,
    fetchInitialData,
    processPayment
  };
};

export { useTelegram };
