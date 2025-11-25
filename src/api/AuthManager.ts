import { API_BASE_URL } from '../config';
import { IUserData } from '../types/auth';

export class AuthManager {
    private static instance: AuthManager;
    private userData: IUserData | null = null;
    private authUrl: string | null = null;
    private performingRequest: boolean = false;
    private _token: string | null = null;

    private readonly urls = {
        login: '/auth/google/url',
        user: '/auth/user',
    };

    private constructor() {}

    public static getInstance(): AuthManager {
        if (!AuthManager.instance) {
            AuthManager.instance = new AuthManager();
        }
        return AuthManager.instance;
    }

    private async get<T>(url: string, options: RequestInit = {}): Promise<T> {
        this.performingRequest = true;
        try {
            const response = await fetch(API_BASE_URL + url, {
                method: 'GET',
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${this.getToken()}`
                }
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('Request failed: ', error);
            throw error;
        } finally {
            this.performingRequest = false;
        }
    }

    initToken(): void {
        const queryParams = new URLSearchParams(window.location.search);
        let token = queryParams.get('token');
    
        if (token) {
            localStorage.setItem('token', token);
            history.pushState({}, '', window.location.pathname);
        } else {
            token = localStorage.getItem('token');
        }

        this._token = token;
    }

    getToken(): string | null {
        return this._token;
    }

    async getAuthUrl(): Promise<string> {
        const response = await this.get<{ url: string }>(this.urls.login);
        this.authUrl = response.url;
        return this.authUrl;
    }

    async checkAuthStatus(): Promise<IUserData> {
        const userData = await this.get<IUserData>(this.urls.user);
        this.userData = userData;
        return userData;
    }

    isPerformingRequest(): boolean {
        return this.performingRequest;
    }

    getUserData(): IUserData | null {
        return this.userData;
    }

    openAuthPage(): void {
        if (this.authUrl) {
            window.location.href = this.authUrl;
        }
    }
}
