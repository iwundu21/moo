export type UserProfile = {
  id: string;
  telegramUsername: string;
  profilePictureUrl: string;
  mainBalance: number;
  pendingBalance: number;
  isPremium: boolean;
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
