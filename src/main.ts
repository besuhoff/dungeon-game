import { Game } from './Game';
import { AuthManager } from './utils/AuthManager';
import { ILeaderboardEntry } from './types/auth';

const authManager = AuthManager.getInstance();

function hideElement(elementId: string) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.setProperty('display', 'none');
    }
}

function showElement(elementId: string) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.setProperty('display', 'flex');
    }
}

window.onload = async () => {
    const queryParams = new URLSearchParams(window.location.search);
    let token = queryParams.get('token');

    if (token) {
        localStorage.setItem('token', token);
        history.pushState({}, '', window.location.pathname);
    } else {
        token = localStorage.getItem('token');
    }

    if (token) {
        try {
            await authManager.checkAuthStatus(token);
            await Game.loadResources();
            const leaderboard = await authManager.getLeaderboard();
            updateLeaderboard(leaderboard);
            showScreen('leaderboard');
            document.getElementById('username')!.textContent = authManager.getUserData()!.username;

        } catch (error) {
            hideElement('loader');
            showElement('loginButton');
        }
    } else {
        hideElement('loader');
        showElement('loginButton');
    }

};

function showScreen(screenId: string) {
    document.querySelectorAll<HTMLDivElement>('.screen').forEach((screen) => {
        screen.style.setProperty('display', 'none');
    });
    document.getElementById(screenId + 'Screen')?.style.setProperty('display', 'flex');
}

function updateLeaderboard(leaderboard: ILeaderboardEntry[]) {
    const leaderboardList = document.getElementById('leaderboardList');
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

document.getElementById('loginButton')?.addEventListener('click', async () => {
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

document.getElementById('startGameButton')?.addEventListener('click', () => {
    showScreen('game');
    const game = new Game();
    game.start();
});
