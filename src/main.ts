import { Game } from './utils/Game';
import { AuthManager } from './api/AuthManager';
import { LeaderboardManager } from './api/LeaderboardManager';
import { ILeaderboardEntry } from './types/auth';

const authManager = AuthManager.getInstance();
const leaderboardManager = LeaderboardManager.getInstance();

function getElement<T extends HTMLElement>(elementId: string): T | null {
    return document.getElementById(elementId) as T;
}

function hideElement(elementId: string) {
    const element = getElement(elementId);
    if (element) {
        element.style.setProperty('display', 'none');
    }
}

function showElement(elementId: string) {
    const element = getElement(elementId);
    if (element) {
        element.style.setProperty('display', 'flex');
    }
}

function showScreen(screenId: string) {
    document.querySelectorAll<HTMLDivElement>('.screen').forEach((screen) => {
        screen.style.setProperty('display', 'none');
    });
    getElement(screenId + 'Screen')?.style.setProperty('display', 'flex');
}

window.onload = async () => {
    try {
        authManager.initToken();
        await authManager.checkAuthStatus();
        await Game.loadResources();
        const leaderboard = await leaderboardManager.getLeaderboard();
        updateLeaderboard(leaderboard);
        showScreen('leaderboard');
        getElement('username')!.textContent = authManager.getUserData()!.username;
    } catch (error) {
        console.error(error);
        hideElement('loader');
        showElement('loginButton');
    }
};

function updateLeaderboard(leaderboard: ILeaderboardEntry[]) {
    const leaderboardList = getElement('leaderboardList');
    if (!leaderboardList) return;

    leaderboardList.innerHTML = leaderboard
        .slice(0, 10) // Show top 10
        .map((entry, index) => `
            <li class="leaderboard-item">
                <span><span class="rank">#${index + 1}</span> ${entry.name}</span>
                <span class="score">${entry.score}</span>
            </li>
        `)
        .join('');
}

getElement('loginButton')?.addEventListener('click', async () => {
    if (authManager.isPerformingRequest()) {
        return;
    }

    try {
        const authUrl = await authManager.getAuthUrl();
        authManager.openAuthPage();
    } catch (error) {
        console.error('Authentication failed:', error);
        // You might want to show an error message to the user
    }
});

getElement('startGameButton')?.addEventListener('click', async (e) => {
    const game = new Game();
    try {
        await game.start();
        showScreen('game');
    } catch (error) {
        console.error('Game initialization failed:', error);
        if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
            const errorElement = (e.target as HTMLButtonElement).parentElement?.querySelector<HTMLParagraphElement>('.error');
            if (errorElement) {
                errorElement.textContent = "There's a problem on our end. Please try again later.";
                errorElement.style.setProperty('display', 'block');
            }
        }
        // You might want to show an error message to the user
    }
});
