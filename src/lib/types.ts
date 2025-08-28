
export type UserProfile = {
  id: string;
  telegramUsername: string;
  profilePictureUrl: string;
  mainBalance: number;
  pendingBalance: number;
  isPremium: boolean;
  purchasedBoosts: string[];
  isLicenseActive: boolean;
  completedSocialTasks?: { [key: string]: 'idle' | 'verifying' | 'completed' };
  hasClaimedAirdrop?: boolean;
  referredBy?: string;
};

export type LeaderboardEntry = {
  rank: number;
  username: string;
  profilePictureUrl: string;
  balance: number;
};

export type Referral = {
  username: string;
  profilePictureUrl: string;
};

export type DistributionRecord = {
  timestamp: Date;
  amount: number;
};

export type AirdropClaim = {
  userId: string;
  username: string;
  walletAddress: string;
  amount: number;
  profilePictureUrl: string;
};
