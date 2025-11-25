import { io, Socket } from "socket.io-client";
import * as config from "../config";
import { AuthManager } from "./AuthManager";
import {
  PlayerJoinedData,
  PlayerLeftData,
  PositionUpdateData,
} from "../types/socketEvents";

export class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private _gameStateHandlers: Map<string, (data: any) => void> = new Map();
  private _gameActionHandlers: Map<string, (data: any) => void> = new Map();
  private _positionUpdateHandler: ((data: PositionUpdateData) => void) | null =
    null;
  private _playerJoinedHandler: ((data: PlayerJoinedData) => void) | null =
    null;
  private _playerLeftHandler: ((data: PlayerLeftData) => void) | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(sessionId: string): Socket {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(config.API_DOMAIN, {
      query: {
        sessionId,
        token: AuthManager.getInstance().getToken(),
      },
      path: "/ws/socket.io",
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    this.setupEventListeners();
    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public emit(event: string, data: any): void {
    if (!this.socket) {
      console.warn("Attempting to emit without socket connection");
      return;
    }
    this.socket.emit(event, data);
  }

  public triggerGameAction<T>(type: string, data: T): void {
    if (!this.socket) {
      console.warn(
        "Attempting to trigger game action without socket connection"
      );
      return;
    }
    this.socket.emit("game_action", { type, data });
  }

  public triggerPositionUpdate(x: number, y: number, rotation: number): void {
    if (!this.socket) {
      console.warn(
        "Attempting to trigger position update without socket connection"
      );
      return;
    }

    this.socket.emit("position_update", {
      position: { x, y, rotation },
      date: window.performance.now(),
    });
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Connected to socket server");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });

    this.socket.on("error", (error: any) => {
      console.error("Socket error:", error);
    });

    this.socket.on("game_action", (data: any) => {
      if (this._gameActionHandlers.has(data.type)) {
        this._gameActionHandlers.get(data.type)?.(data.data);
      }
    });

    this.socket.on("game_state", (data: any) => {
      if (this._gameStateHandlers.has(data.type)) {
        this._gameStateHandlers.get(data.type)?.(data.data);
      }
    });

    this.socket.on("position_update", (data: PositionUpdateData) => {
      this._positionUpdateHandler?.(data);
    });

    this.socket.on("player_joined", (data: PlayerJoinedData) => {
      this._playerJoinedHandler?.(data);
    });

    this.socket.on("player_left", (data: PlayerLeftData) => {
      this._playerLeftHandler?.(data);
    });
  }

  public onGameAction<T>(type: string, callback: (data: T) => void): void {
    this._gameActionHandlers.set(type, callback);
  }

  public onGameState<T>(type: string, callback: (data: T) => void): void {
    this._gameStateHandlers.set(type, callback);
  }

  public onPositionUpdate(callback: (data: PositionUpdateData) => void): void {
    this._positionUpdateHandler = callback;
  }

  public onPlayerJoined(callback: (data: PlayerJoinedData) => void): void {
    this._playerJoinedHandler = callback;
  }

  public onPlayerLeft(callback: (data: PlayerLeftData) => void): void {
    this._playerLeftHandler = callback;
  }
}
