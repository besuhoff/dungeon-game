import { IAuthManager, IUserData, ILeaderboardEntry, IAuthResponse } from '../types/auth';
import * as config from '../config';

export class AuthManager implements IAuthManager {
    private static instance: AuthManager;
    private userData: IUserData | null = null;
    private authUrl: string | null = null;
    private leaderboardData: ILeaderboardEntry[] = [];
    private performingRequest: boolean = false;

    private readonly urls = {
        login: '/auth/google/url',
        authCallback: '/auth/google/callback',
        leaderboard: '/leaderboard/global',
        user: '/auth/user'
    };

    private constructor() {}

    static getInstance(): AuthManager {
        if (!AuthManager.instance) {
            AuthManager.instance = new AuthManager();
        }
        return AuthManager.instance;
    }

    private async get<T>(url: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(config.API_BASE_URL + url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async getAuthUrl(): Promise<string> {
        this.performingRequest = true;
        try {
            const response = await this.get<IAuthResponse>(this.urls.login);
            this.authUrl = response.url;
            return this.authUrl;
        } finally {
            this.performingRequest = false;
        }
    }

    openAuthPage(): void {
        if (this.authUrl) {
            window.location.href = this.authUrl;
        }
    }

    async checkAuthStatus(token: string): Promise<IUserData> {
        const userData = await this.get<IUserData>(this.urls.user, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        this.userData = userData;
        return userData;
    }

    async getLeaderboard(): Promise<ILeaderboardEntry[]> {
        const leaderboard = await this.get<ILeaderboardEntry[]>(this.urls.leaderboard);
        this.leaderboardData = leaderboard;
        return leaderboard;
    }

    isPerformingRequest(): boolean {
        return this.performingRequest;
    }

    getUserData(): IUserData | null {
        return this.userData;
    }
}
