export type UserProfile = {
  id: string;
  telegramUsername: string;
  profilePictureUrl: string;
  mainBalance: number;
  pendingBalance: number;
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
