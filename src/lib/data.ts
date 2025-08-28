
import type { UserProfile, LeaderboardEntry, Referral, DistributionRecord } from './types';
import db from './db.json';

// This file now imports data from db.json to populate the initial state.

export const defaultUserProfile: UserProfile = db.defaultUserProfile;

export const mockLeaderboard: LeaderboardEntry[] = db.leaderboard;

export const mockReferrals: Referral[] = db.referrals;

// For distribution history, we'll convert the string timestamps to Date objects
export const mockDistributionHistory: DistributionRecord[] = db.distributionHistory.map(record => ({
  ...record,
  timestamp: new Date(record.timestamp),
}));
