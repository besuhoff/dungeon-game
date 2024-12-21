export interface IAuthManager {
    getAuthUrl(): Promise<string>;
    checkAuthStatus(token: string): Promise<IUserData>;
    getLeaderboard(): Promise<ILeaderboardEntry[]>;
}

export interface IUserData {
    id: string;
    username: string;
    email: string;
    picture?: string;
}

export interface ILeaderboardEntry {
    name: string;
    score: number;
}

export interface IAuthResponse {
    url: string;
}
