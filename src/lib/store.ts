
import type { UserProfile, LeaderboardEntry, AirdropClaim, Referral } from './types';

type Listener = () => void;

class AppStore {
  private userProfile: UserProfile | null = null;
  private leaderboard: LeaderboardEntry[] = [];
  private referrals: Referral[] = [];
  private claimedAirdrops: AirdropClaim[] = [];
  private isAirdropLive: boolean = true;
  private listeners: Set<Listener> = new Set();

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
  initialize(profile: UserProfile, mockLeaderboard: LeaderboardEntry[], mockReferrals: Referral[]): void {
    if (this.userProfile) return; // Already initialized

    this.userProfile = profile;
    this.leaderboard = [...mockLeaderboard];
    this.referrals = [...mockReferrals];
    
    const userInMock = this.leaderboard.some(u => u.username === this.userProfile!.telegramUsername);

    if (!userInMock) {
      this.leaderboard.push({
        rank: 0,
        username: this.userProfile!.telegramUsername,
        profilePictureUrl: this.userProfile!.profilePictureUrl,
        balance: this.userProfile!.mainBalance
      });
    }
    this.sortAndRankLeaderboard();
    this.notifyListeners();
  }

  // --- Getters ---
  getUserProfile = (): UserProfile | null => this.userProfile;
  getLeaderboard = (): LeaderboardEntry[] => [...this.leaderboard];
  getReferrals = (): Referral[] => [...this.referrals];
  getClaimedAirdrops = (): AirdropClaim[] => [...this.claimedAirdrops];
  getAirdropStatus = (): boolean => this.isAirdropLive;

  // --- Setters / Updaters ---
  setAirdropStatus(isLive: boolean): void {
    this.isAirdropLive = isLive;
    this.notifyListeners();
  }

  addClaimRecord(claim: AirdropClaim): void {
    this.claimedAirdrops.push(claim);
    this.notifyListeners();
  }

  updateUserProfile(updates: Partial<UserProfile>): void {
    if (!this.userProfile) return;

    const wasLeaderboardUpdated = 'mainBalance' in updates;
    this.userProfile = { ...this.userProfile, ...updates };
    
    if (wasLeaderboardUpdated) {
      const userInLeaderboardIndex = this.leaderboard.findIndex(u => u.username === this.userProfile!.telegramUsername);
      if (userInLeaderboardIndex !== -1) {
        this.leaderboard[userInLeaderboardIndex].balance = this.userProfile.mainBalance;
      }
      this.sortAndRankLeaderboard();
    }
    this.notifyListeners();
  }
  
  private sortAndRankLeaderboard(): void {
    this.leaderboard.sort((a, b) => b.balance - a.balance);
    this.leaderboard.forEach((user, index) => {
      user.rank = index + 1;
    });
  }
}

// Export a singleton instance of the store
export const store = new AppStore();
