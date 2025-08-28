
import type { UserProfile, LeaderboardEntry, AirdropClaim, Referral } from './types';

type Listener = () => void;

const STORE_KEY = 'moo-app-store';

interface AppState {
  userProfiles: { [key: string]: UserProfile };
  leaderboard: LeaderboardEntry[];
  referrals: { [key: string]: Referral[] };
  claimedAirdrops: AirdropClaim[];
  isAirdropLive: boolean;
}

class AppStore {
  private state: AppState = {
    userProfiles: {},
    leaderboard: [],
    referrals: {},
    claimedAirdrops: [],
    isAirdropLive: true,
  };
  private listeners: Set<Listener> = new Set();
  private isInitialized = false;

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const storedState = window.localStorage.getItem(STORE_KEY);
      if (storedState) {
        this.state = JSON.parse(storedState);
      }
    } catch (error) {
      console.error("Could not load state from localStorage", error);
    }
  }

  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error("Could not save state to localStorage", error);
    }
  }


  // --- Subscription ---
  subscribe(listener: Listener): void {
    this.listeners.add(listener);
  }

  unsubscribe(listener: Listener): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  // --- Initialization ---
  initialize(profile: UserProfile): void {
    // If the user profile doesn't exist, it's a new user.
    if (!this.state.userProfiles[profile.id]) {
      this.state.userProfiles[profile.id] = profile;
      
      const userInLeaderboard = this.state.leaderboard.some(u => u.username === profile.telegramUsername);
      if (!userInLeaderboard) {
        this.state.leaderboard.push({
            rank: 0, 
            username: profile.telegramUsername,
            profilePictureUrl: profile.profilePictureUrl,
            balance: profile.mainBalance
        });
      }
      this.sortAndRankLeaderboard();
    }
    
    this.isInitialized = true;
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  // --- Getters ---
  getUserProfile = (id: string): UserProfile | null => this.state.userProfiles[id] || null;
  getAllUserProfiles = (): { [key: string]: UserProfile } => this.state.userProfiles;
  getLeaderboard = (): LeaderboardEntry[] => [...this.state.leaderboard];
  getReferrals = (id: string): Referral[] => this.state.referrals[id] || [];
  getClaimedAirdrops = (): AirdropClaim[] => [...this.state.claimedAirdrops];
  getAirdropStatus = (): boolean => this.state.isAirdropLive;

  // --- Setters / Updaters ---
  setAirdropStatus(isLive: boolean): void {
    this.state.isAirdropLive = isLive;
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  addClaimRecord(claim: AirdropClaim): void {
    this.state.claimedAirdrops.push(claim);
    this.saveToLocalStorage();
    this.notifyListeners();
  }
  
  addReferral(userId: string, referral: Referral): void {
    if (!this.state.referrals[userId]) {
        this.state.referrals[userId] = [];
    }
    this.state.referrals[userId].push(referral);
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  updateUserProfile(userId: string, updates: Partial<UserProfile>): void {
    if (!this.state.userProfiles[userId]) return;

    const wasLeaderboardUpdated = 'mainBalance' in updates;
    this.state.userProfiles[userId] = { ...this.state.userProfiles[userId], ...updates };
    
    const userProfile = this.state.userProfiles[userId];

    if (wasLeaderboardUpdated) {
      const userInLeaderboardIndex = this.state.leaderboard.findIndex(u => u.username === userProfile.telegramUsername);
      if (userInLeaderboardIndex !== -1) {
        this.state.leaderboard[userInLeaderboardIndex].balance = userProfile.mainBalance;
      } else {
         this.state.leaderboard.push({
            rank: 0,
            username: userProfile.telegramUsername,
            profilePictureUrl: userProfile.profilePictureUrl,
            balance: userProfile.mainBalance
        });
      }
      this.sortAndRankLeaderboard();
    }
    this.saveToLocalStorage();
    this.notifyListeners();
  }
  
  private sortAndRankLeaderboard(): void {
    this.state.leaderboard.sort((a, b) => b.balance - a.balance);
    this.state.leaderboard.forEach((user, index) => {
      user.rank = index + 1;
    });
  }
}

// Export a singleton instance of the store
export const store = new AppStore();
