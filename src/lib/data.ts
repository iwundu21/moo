import type { UserProfile, LeaderboardEntry, Referral, DistributionRecord } from './types';

export const mockUser: UserProfile = {
  id: '12345',
  telegramUsername: 'MooMaster',
  profilePictureUrl: 'https://picsum.photos/100/100',
  mainBalance: 12500.75,
  pendingBalance: 750.25,
  isPremium: true,
  purchasedBoosts: ['2x'],
};

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, username: 'CryptoKing', profilePictureUrl: 'https://picsum.photos/50/50?random=1', balance: 150000 },
  { rank: 2, username: 'AirdropHunter', profilePictureUrl: 'https://picsum.photos/50/50?random=2', balance: 132000 },
  { rank: 3, username: 'MooMaster', profilePictureUrl: 'https://picsum.photos/50/50?random=3', balance: 125000 },
  { rank: 4, username: 'ShillLord', profilePictureUrl: 'https://picsum.photos/50/50?random=4', balance: 110000 },
  { rank: 5, username: 'DiamondHands', profilePictureUrl: 'https://picsum.photos/50/50?random=5', balance: 98000 },
  { rank: 6, username: 'PaperHands', profilePictureUrl: 'https://picsum.photos/50/50?random=6', balance: 85000 },
  { rank: 7, username: 'SatoshiJr', profilePictureUrl: 'https://picsum.photos/50/50?random=7', balance: 76000 },
  { rank: 8, username: 'GM', profilePictureUrl: 'https://picsum.photos/50/50?random=8', balance: 65000 },
  { rank: 9, username: 'WAGMI', profilePictureUrl: 'https://picsum.photos/50/50?random=9', balance: 54000 },
  { rank: 10, username: 'NGMI', profilePictureUrl: 'https://picsum.photos/50/50?random=10', balance: 43000 },
];

export const mockReferrals: Referral[] = [
    { username: 'Friend1', profilePictureUrl: 'https://picsum.photos/50/50?random=11' },
    { username: 'Friend2', profilePictureUrl: 'https://picsum.photos/50/50?random=12' },
    { username: 'Friend3', profilePictureUrl: 'https://picsum.photos/50/50?random=13' },
];

export const mockDistributionHistory: DistributionRecord[] = [
  { timestamp: new Date(new Date().getTime() - 1 * 60 * 60 * 1000), amount: 750.25 },
  { timestamp: new Date(new Date().getTime() - 2 * 60 * 60 * 1000), amount: 730.10 },
  { timestamp: new Date(new Date().getTime() - 3 * 60 * 60 * 1000), amount: 780.50 },
  { timestamp: new Date(new Date().getTime() - 4 * 60 * 60 * 1000), amount: 710.00 },
  { timestamp: new Date(new Date().getTime() - 5 * 60 * 60 * 1000), amount: 765.90 },
];
