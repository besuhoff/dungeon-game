import {
  Session,
  CreateSessionRequest,
  UpdateSessionRequest,
  AddSessionChunksRequest,
  SessionChunk,
} from "../types/session";
import { HttpClient } from "./HttpClient";
import * as config from "../config";
import { SocketService } from "./SocketService";
import { IBullet } from "../types/screen-objects/IBullet";
import {
  BulletCreatedData,
  BulletRemovedData,
  PlayerJoinedData,
  PlayerLeftData,
  PositionUpdateData,
} from "../types/socketEvents";
import { IPlayer } from "../types/screen-objects/IPlayer";

export class SessionManager {
  private static instance: SessionManager;
  private currentSession: Session | null = null;
  private socketService: SocketService;
  private lastPositionUpdate: number = 0;
  private readonly POSITION_UPDATE_THROTTLE = 40;
  private pendingPositionUpdate: {
    x: number;
    y: number;
    rotation: number;
  } | null = null;
  private positionUpdateTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.socketService = SocketService.getInstance();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public async listSessions(): Promise<Session[]> {
    return await HttpClient.get<Session[]>("/sessions");
  }

  public async startSession(sessionName: string): Promise<Session> {
    const session = await HttpClient.post<Session>("/sessions", {
      name: sessionName,
      health: config.PLAYER_LIVES,
    } as CreateSessionRequest);

    this.currentSession = session;
    this.socketService.connect(session._id);
    return session;
  }

  public async joinSession(sessionId: string): Promise<Session> {
    const session = await HttpClient.post<Session>(
      `/sessions/${sessionId}/join`
    );
    this.currentSession = session;
    this.socketService.connect(session._id);
    return session;
  }

  public async addSessionChunks(
    request: AddSessionChunksRequest
  ): Promise<Session> {
    if (!this.currentSession) {
      throw new Error("No active session");
    }

    const session = await HttpClient.post<Session>(
      `/sessions/${this.currentSession._id}/chunks`,
      request
    );

    this.currentSession = session;
    return session;
  }

  public async updateSessionChunk(chunk: SessionChunk): Promise<Session> {
    return this.addSessionChunks({
      chunks: [chunk],
    });
  }

  public async fetchSessionChunks(): Promise<Session> {
    if (!this.currentSession) {
      throw new Error("No active session");
    }

    const session = await HttpClient.get<Session>(
      `/sessions/${this.currentSession._id}/chunks`
    );

    this.currentSession = session;
    return session;
  }

  public async updateSession(
    score: number,
    kills: number,
    money: number
  ): Promise<Session> {
    if (!this.currentSession) {
      throw new Error("No active session");
    }

    const session = await HttpClient.patch<Session>(
      `/sessions/${this.currentSession._id}`,
      { score, kills, money } as UpdateSessionRequest
    );

    this.currentSession = session;
    return session;
  }

  public async endSession(): Promise<Session> {
    if (!this.currentSession) {
      throw new Error("No active session");
    }

    const session = await HttpClient.post<Session>(
      `/sessions/${this.currentSession._id}/end`
    );
    this.currentSession = null;
    this.socketService.disconnect();
    return session;
  }

  public getCurrentSession(): Session | null {
    return this.currentSession;
  }

  public notifyBulletCreated(bullet: IBullet): void {
    if (!this.currentSession) {
      console.warn("Attempting to notify about bullet without active session");
      return;
    }

    this.socketService.triggerGameAction<BulletCreatedData>(
      config.WEBSOCKET_ACTIONS.BULLET_CREATED,
      {
        x: bullet.x,
        y: bullet.y,
        id: bullet.id,
        velocity: bullet.velocity,
        isEnemy: bullet.isEnemy,
        ownerId: bullet.ownerId,
        date: window.performance.now(),
      }
    );
  }

  notifyPositionUpdate(player: IPlayer): void {
    if (!this.currentSession) {
      console.warn(
        "Attempting to notify about position update without active session"
      );
      return;
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastPositionUpdate;

    // Store the current position as pending
    this.pendingPositionUpdate = {
      x: player.x,
      y: player.y,
      rotation: player.rotation,
    };

    // If we're within throttle window, schedule the update
    if (timeSinceLastUpdate < this.POSITION_UPDATE_THROTTLE) {
      if (!this.positionUpdateTimeout) {
        this.positionUpdateTimeout = setTimeout(() => {
          if (this.pendingPositionUpdate) {
            const { x, y, rotation } = this.pendingPositionUpdate;

            this.socketService.triggerPositionUpdate(x, y, rotation);
            this.lastPositionUpdate = window.performance.now();
            this.pendingPositionUpdate = null;
            this.positionUpdateTimeout = null;
          }
        }, this.POSITION_UPDATE_THROTTLE - timeSinceLastUpdate);
      }
      return;
    }

    // If we're outside throttle window, send immediately
    this.socketService.triggerPositionUpdate(
      player.x,
      player.y,
      player.rotation
    );
    this.lastPositionUpdate = window.performance.now();
    this.pendingPositionUpdate = null;
    if (this.positionUpdateTimeout) {
      clearTimeout(this.positionUpdateTimeout);
      this.positionUpdateTimeout = null;
    }
  }

  public notifyBulletRemoved(bulletId: string): void {
    if (!this.currentSession) {
      console.warn("Attempting to notify about bullet without active session");
      return;
    }

    this.socketService.triggerGameAction<BulletRemovedData>(
      config.WEBSOCKET_ACTIONS.BULLET_REMOVED,
      {
        id: bulletId,
        date: window.performance.now(),
      }
    );
  }

  public onBulletCreated(callback: (bullet: BulletCreatedData) => void): void {
    this.socketService.onGameAction<BulletCreatedData>(
      config.WEBSOCKET_ACTIONS.BULLET_CREATED,
      callback
    );
  }

  public onBulletRemoved(callback: (bullet: BulletRemovedData) => void): void {
    this.socketService.onGameAction<BulletRemovedData>(
      config.WEBSOCKET_ACTIONS.BULLET_REMOVED,
      callback
    );
  }

  public onChunksUpdated(callback: (session: Session) => void): void {
    this.socketService.onGameState(
      config.WEBSOCKET_GAME_STATE_EVENTS.CHUNKS_UPDATED,
      callback
    );
  }

  public onPositionUpdate(callback: (data: PositionUpdateData) => void): void {
    this.socketService.onPositionUpdate(callback);
  }

  public onPlayerJoined(callback: (player: PlayerJoinedData) => void): void {
    this.socketService.onPlayerJoined(callback);
  }

  public onPlayerLeft(callback: (player: PlayerLeftData) => void): void {
    this.socketService.onPlayerLeft(callback);
  }
}
