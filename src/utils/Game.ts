import * as config from "../config";
import { Bonus } from "../entities/Bonus";
import { Enemy } from "../entities/Enemy";
import { Player } from "../entities/Player";
import { Wall } from "../entities/Wall";
import { AudioManager } from "./AudioManager";
import { loadImage } from "./loadImage";
import { World } from "./World";
import { SessionManager } from "../api/SessionManager";
import { AuthManager } from "../api/AuthManager";
import { Bullet } from "../entities/Bullet";
import { Point2D } from "./geometry/Point2D";
import { Session } from "../types/session";
import { OtherPlayer } from "../entities/OtherPlayer";
import { Vector2D } from "./geometry/Vector2D";

export class Game {
  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;
  private _lastTime: number = 0;
  private _world: World | null = null;
  private _activeKeys: Set<string> = new Set();
  private _authManager: AuthManager;
  private _sessionManager: SessionManager;

  public get world(): World | null {
    return this._world;
  }

  constructor() {
    this._canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    this._ctx = this._canvas.getContext("2d")!;

    this._canvas.width = config.SCREEN_WIDTH;
    this._canvas.height = config.SCREEN_HEIGHT;

    this._authManager = AuthManager.getInstance();
    this._sessionManager = SessionManager.getInstance();

    this.setupEventListeners();
  }

  public static async loadResources(): Promise<void> {
    const audioManager = AudioManager.getInstance();

    await Promise.all([
      loadImage(config.TEXTURES.FLOOR),
      loadImage(config.TEXTURES.PLAYER),
      loadImage(config.TEXTURES.ENEMY),
      loadImage(config.TEXTURES.WALL),
      audioManager.loadSound(config.SOUNDS.PLAYER_HURT),
      audioManager.loadSound(config.SOUNDS.ENEMY_HURT),
      audioManager.loadSound(config.SOUNDS.TORCH),
    ]);

    // Load non-critical resources asynchronously
    audioManager.loadSound(config.SOUNDS.PLAYER_BULLET_RECHARGE);
    audioManager.loadSound(config.SOUNDS.BONUS_PICKUP);
    audioManager.loadSound(config.SOUNDS.GAME_OVER);
    audioManager.loadSound(config.SOUNDS.BULLET);
    loadImage(config.TEXTURES.ENEMY_BLOOD);
    loadImage(config.TEXTURES.AID_KIT);
    loadImage(config.TEXTURES.GOGGLES);
  }

  private setupEventListeners(): void {
    window.addEventListener("keydown", (e) => {
      this._activeKeys.add(e.key);
      this.handleKeyDown(e);
    });

    window.addEventListener("keyup", (e) => {
      this._activeKeys.delete(e.key);
    });

    window.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    window.addEventListener("mousedown", (e) => this.handleMouseDown(e));

    this._sessionManager.onBulletCreated((bulletData) => {
      const bullet = new Bullet(
        this._world!,
        new Point2D(bulletData.x, bulletData.y),
        new Vector2D(bulletData.velocity.x, bulletData.velocity.y).getAngle(),
        bulletData.isEnemy,
        bulletData.ownerId
      );

      if (bulletData.ownerId) {
        this._world!.getOtherPlayerById(bulletData.ownerId)?.registerShot(
          bullet
        );
      } else {
        this._world!.bulletManager.registerShot(bullet);
      }
    });

    this._sessionManager.onChunksUpdated((session) => {
      if (this._world && session.world_map) {
        this._world.unpackChunksFromSession(session.world_map);
      }
    });

    this._sessionManager.onPositionUpdate((data) => {
      if (this._world) {
        const point = new Point2D(data.position.x, data.position.y);
        this._world.updateOtherPlayerPosition(
          data.user_id,
          point,
          data.position.rotation,
          data.date
        );
      }
    });

    this._sessionManager.onPlayerJoined(({ user }) => {
      if (this._world) {
        this._world.addOtherPlayer(user);
      }
    });

    this._sessionManager.onPlayerLeft(({ user_id: playerId }) => {
      if (this._world) {
        this._world.removeOtherPlayer(playerId);
      }
    });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "p") {
      this._world?.togglePause();
    }
    if (e.key === "F3") {
      this._world?.toggleDebug();
    }
    if (e.key === "r" || e.key === "R") {
      this._world?.restart();
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this._canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Mouse position handling will be used for player rotation
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      // Left click
      const rect = this._canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Shooting will be handled here
    }
  }

  public async start(session: Session): Promise<void> {
    const chunks = session?.world_map;

    if (session) {
      const userData = this._authManager.getUserData();
      const multiplayerMode =
        session.host && userData && session.host._id === userData._id
          ? "host"
          : "guest";
      this._world = new World(
        Player,
        Enemy,
        Wall,
        Bonus,
        OtherPlayer,
        multiplayerMode
      );
      const position = new Point2D(0, 0);
      let rotation = 0;

      if (session.players) {
        const currentUserId = this._authManager.getUserData()!._id;
        const { [currentUserId]: currentPlayer, ...otherPlayers } =
          session.players;

        rotation = currentPlayer.position.rotation;
        position.setTo(currentPlayer.position.x, currentPlayer.position.y);

        for (const player of Object.values(otherPlayers).filter(
          (player) => player.is_connected
        )) {
          this._world.addOtherPlayer(player);
        }
      }

      this._world.initPlayer(position, rotation);

      if (session.world_map) {
        this._world.unpackChunksFromSession(session.world_map);
      }
      requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
  }

  private gameLoop(timestamp: number): void {
    const dt = (timestamp - this._lastTime) / 1000;
    this._lastTime = timestamp;

    this._world?.handleInput(this._activeKeys, dt);
    this._world?.update(dt);
    this.draw();

    requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
  }

  private draw(): void {
    // Clear the canvas
    this._ctx.fillStyle = "black";
    this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

    // Draw the world
    this._world?.draw(this._ctx);
  }
}
