export interface IAuthManager {
    getAuthUrl(): Promise<string>;
    checkAuthStatus(token: string): Promise<IUserData>;
}

export interface IUserData {
    _id: string;
    username: string;
    email: string;
    is_active: boolean;
    current_session: string;
}

export interface ILeaderboardEntry {
    name: string;
    score: number;
}

export interface IAuthResponse {
    url: string;
}
