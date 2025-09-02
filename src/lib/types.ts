

export type UserProfile = {
  id: string;
  telegramUsername: string;
  firstName: string;
  profilePictureUrl: string;
  mainBalance: number;
  pendingBalance: number;
  isPremium: boolean;
  purchasedBoosts: string[];
  isLicenseActive: boolean;
  completedSocialTasks?: { [key: string]: 'idle' | 'verifying' | 'completed' };
  hasClaimedAirdrop?: boolean;
  referredBy?: string | null;
  referralCode?: string;
  airdropStatus?: 'processing' | 'distributed' | 'no-claim';
  walletAddress?: string;
  airdropClaimedAmount?: number;
  lifetimeBalance?: number;
};

export type LeaderboardEntry = {
  rank: number;
  username: string;
  firstName: string;
  profilePictureUrl: string;
  balance: number;
  isPremium: boolean;
};

export type Referral = {
  firstName: string;
  profilePictureUrl: string;
  timestamp: Date;
};

export type AirdropClaim = {
  userId: string;
  username:string;
  firstName: string;
  walletAddress: string;
  amount: number;
  profilePictureUrl: string;
  timestamp: Date;
  status: 'processing' | 'distributed' | 'no-claim';
  isPremium?: boolean;
};

export type ClaimRecord = {
  id: string;
  amount: number;
  timestamp: Date;
};

export type AppSettings = {
    isAirdropLive: boolean;
    airdropEndDate: Date | null;
};
    
