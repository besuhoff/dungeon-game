import { Game } from "./utils/Game";
import { AuthManager } from "./api/AuthManager";
import { LeaderboardManager } from "./api/LeaderboardManager";
import { SessionManager } from "./api/SessionManager";
import { ILeaderboardEntry } from "./types/auth";
import { Session } from "./types/session";

const authManager = AuthManager.getInstance();
const leaderboardManager = LeaderboardManager.getInstance();
const sessionManager = SessionManager.getInstance();

function getElement<T extends HTMLElement>(elementId: string): T | null {
  return document.getElementById(elementId) as T;
}

function hideElement(elementId: string) {
  const element = getElement(elementId);
  if (element) {
    element.style.setProperty("display", "none");
  }
}

function showElement(elementId: string) {
  const element = getElement(elementId);
  if (element) {
    element.style.setProperty("display", "flex");
  }
}

function showScreen(screenId: string) {
  document.querySelectorAll<HTMLDivElement>(".screen").forEach((screen) => {
    screen.style.setProperty("display", "none");
  });
  getElement(screenId + "Screen")?.style.setProperty("display", "flex");
}

function generateFunnySessionName(): string {
  const adjectives = [
    "Silly",
    "Crazy",
    "Brave",
    "Sneaky",
    "Mighty",
    "Clumsy",
    "Epic",
    "Fancy",
    "Grumpy",
    "Happy",
    "Sleepy",
    "Dancing",
    "Flying",
    "Invisible",
    "Legendary",
    "Mysterious",
    "Chaotic",
    "Funky",
    "Bizarre",
    "Magical",
  ];

  const nouns = [
    "Dragon",
    "Goblin",
    "Wizard",
    "Knight",
    "Potato",
    "Unicorn",
    "Troll",
    "Ninja",
    "Pirate",
    "Skeleton",
    "Chicken",
    "Banana",
    "Mushroom",
    "Phoenix",
    "Penguin",
    "Donut",
    "Cactus",
    "Platypus",
    "Waffle",
    "Pickles",
  ];

  const places = [
    "Dungeon",
    "Castle",
    "Cave",
    "Tower",
    "Forest",
    "Swamp",
    "Mountain",
    "Island",
    "Kingdom",
    "Realm",
    "Lair",
    "Temple",
    "Abyss",
    "Palace",
    "Fortress",
  ];

  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomPlace = places[Math.floor(Math.random() * places.length)];

  return `${randomAdjective} ${randomNoun} ${randomPlace}`;
}

window.onload = async () => {
  try {
    authManager.initToken();
    await authManager.checkAuthStatus();
    await Game.loadResources();
    const [leaderboard, sessions] = await Promise.all([
      leaderboardManager.getLeaderboard(),
      sessionManager.listSessions(),
    ]);
    updateLeaderboard(leaderboard);
    updateSessions(sessions);
    showScreen("leaderboard");
    getElement("username")!.textContent = authManager.getUserData()!.username;
  } catch (error) {
    console.error(error);
    hideElement("loader");
    showElement("loginButton");
  }
};

function updateLeaderboard(leaderboard: ILeaderboardEntry[]) {
  const leaderboardList = getElement("leaderboardList");
  if (!leaderboardList) return;

  leaderboardList.innerHTML = leaderboard
    .slice(0, 10) // Show top 10
    .map(
      (entry, index) => `
            <li class="leaderboard-item">
                <span><span class="rank">#${index + 1}</span> ${entry.name}</span>
                <span class="score">${entry.score}</span>
            </li>
        `
    )
    .join("");
}

function updateSessions(sessions: Session[]) {
  const sessionsList = getElement("sessionsList");
  if (!sessionsList) return;

  if (sessions.length === 0) {
    sessionsList.innerHTML =
      '<li class="sessions-empty">No active sessions</li>';
    return;
  }

  sessionsList.innerHTML = sessions
    .map((session) => {
      const playerCount = Object.keys(session.players).length;
      const maxPlayers = session.max_players || 4;
      return `
                <li class="session-item" data-session-id="${session.id}">
                    <span class="session-name">"${session.name}" (${session.host.username})</span>
                    <span class="session-players">${playerCount}/${maxPlayers}</span>
                </li>
            `;
    })
    .join("");

  // Add click handlers to session items
  sessionsList
    .querySelectorAll<HTMLLIElement>(".session-item")
    .forEach((item) => {
      item.addEventListener("click", async () => {
        const sessionId = item.dataset.sessionId;
        if (!sessionId) return;

        const game = new Game();
        try {
          const session = await sessionManager.joinSession(sessionId);
          await game.start(session);
          showScreen("game");
        } catch (error) {
          console.error("Failed to join session:", error);
          const errorElement = document.querySelector<HTMLParagraphElement>(
            "#leaderboardScreen .error"
          );
          if (errorElement) {
            errorElement.textContent =
              "Failed to join session. Please try again.";
            errorElement.style.setProperty("display", "block");
          }
        }
      });
    });
}

getElement("loginButton")?.addEventListener("click", async () => {
  if (authManager.isPerformingRequest()) {
    return;
  }

  try {
    const authUrl = await authManager.getAuthUrl();
    authManager.openAuthPage();
  } catch (error) {
    console.error("Authentication failed:", error);
    // You might want to show an error message to the user
  }
});

getElement("startGameButton")?.addEventListener("click", async () => {
  const modal = getElement("sessionNameModal");
  const input = getElement<HTMLInputElement>("sessionNameInput");

  if (modal && input) {
    input.value = generateFunnySessionName();
    modal.classList.add("show");
    input.focus();
    input.select();
  }
});

getElement("cancelSessionButton")?.addEventListener("click", () => {
  const modal = getElement("sessionNameModal");
  if (modal) {
    modal.classList.remove("show");
  }
});

getElement("createSessionButton")?.addEventListener("click", async () => {
  const modal = getElement("sessionNameModal");
  const input = getElement<HTMLInputElement>("sessionNameInput");
  const sessionName = input?.value.trim() || "";

  if (!sessionName) {
    return;
  }

  if (modal) {
    modal.classList.remove("show");
  }

  const game = new Game();
  try {
    const session = await sessionManager.startSession(sessionName);
    await game.start(session);
    showScreen("game");
  } catch (error) {
    console.error("Game initialization failed:", error);
    if (
      typeof error === "object" &&
      error &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      const errorElement = document.querySelector<HTMLParagraphElement>(
        "#leaderboardScreen .error"
      );
      if (errorElement) {
        errorElement.textContent =
          "There's a problem on our end. Please try again later.";
        errorElement.style.setProperty("display", "block");
      }
    }
  }
});

// Allow Enter key to create session
getElement("sessionNameInput")?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    getElement("createSessionButton")?.click();
  }
});

// Allow Escape key to close modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modal = getElement("sessionNameModal");
    if (modal?.classList.contains("show")) {
      modal.classList.remove("show");
    }
  }
});
