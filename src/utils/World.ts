import * as config from "../config";
import { ScreenObject } from "../entities/ScreenObject";
import { IEnemy, IEnemyFactory } from "../types/screen-objects/IEnemy";
import { IPlayerFactory } from "../types/screen-objects/IPlayer";
import { IPlayer } from "../types/screen-objects/IPlayer";
import { IBonusFactory } from "../types/screen-objects/IBonus";
import { IBonus } from "../types/screen-objects/IBonus";
import { BonusType } from "../types/screen-objects/IBonus";
import { IWallFactory } from "../types/screen-objects/IWall";
import { IWall } from "../types/screen-objects/IWall";
import { IChunk } from "../types/screen-objects/IChunk";
import { IPoint } from "../types/geometry/IPoint";
import { IWorld } from "../types/IWorld";
import { loadImage } from "./loadImage";
import { Point2D } from "./geometry/Point2D";
import { AudioManager } from "./AudioManager";
import { SessionManager } from "../api/SessionManager";
import { SessionChunk, SessionObject, SessionPlayer } from "../types/session";
import {
  IOtherPlayer,
  IOtherPlayerFactory,
} from "../types/screen-objects/IOtherPlayer";
import { Bullet } from "../entities/Bullet";
import { BulletManager } from "../api/BulletManager";

export class World implements IWorld {
  private readonly CHUNK_SIZE = 800; // Same as screen width for now
  private _player: IPlayer | null = null;
  private _otherPlayers: Record<string, IOtherPlayer> = {};
  private _otherPlayersPositionUpdateMap: WeakMap<IOtherPlayer, number> =
    new WeakMap();

  private _enemies: IEnemy[] = [];
  private _walls: IWall[] = [];
  private _bonuses: IBonus[] = [];

  private _gameOver: boolean = false;
  private _paused: boolean = false;
  private floorTexture: HTMLImageElement | null = null;
  private chunks: Map<string, IChunk> = new Map();
  private generatedChunks: Set<string> = new Set();
  private _cameraPoint: IPoint = new Point2D(0, 0);
  private _currentPlayerChunk: IPoint | null = null;
  private _torchRadius: number = config.TORCH_RADIUS;
  private _debug = false;
  private crowdednessFactor = 5;

  private _sessionManager = SessionManager.getInstance();
  private _bulletManager: BulletManager;

  get debug(): boolean {
    return this._debug;
  }

  toggleDebug(): void {
    this._debug = !this._debug;
  }

  get gameOver(): boolean {
    return this._gameOver;
  }

  get paused(): boolean {
    return this._paused;
  }

  get player(): IPlayer | null {
    return this._player;
  }

  get otherPlayers(): IOtherPlayer[] {
    return Object.values(this._otherPlayers);
  }

  getOtherPlayerById(id: string): IOtherPlayer | null {
    return this._otherPlayers[id] || null;
  }

  get walls(): IWall[] {
    return this._walls;
  }

  get enemies(): IEnemy[] {
    return this._enemies;
  }

  get bonuses(): IBonus[] {
    return this._bonuses;
  }

  get cameraPoint(): IPoint {
    return this._cameraPoint;
  }

  get torchRadius(): number {
    return this._torchRadius;
  }

  get multiplayerMode(): "host" | "guest" {
    return this._multiplayerMode;
  }

  get bulletManager(): BulletManager {
    return this._bulletManager;
  }

  constructor(
    private _Player: IPlayerFactory,
    private _Enemy: IEnemyFactory,
    private _Wall: IWallFactory,
    private _Bonus: IBonusFactory,
    private _OtherPlayer: IOtherPlayerFactory,
    private _multiplayerMode: "host" | "guest"
  ) {
    // Load sounds
    const audioManager = AudioManager.getInstance();
    audioManager.loadSound(config.SOUNDS.TORCH).then(() => {
      // Start playing torch sound in a loop
      audioManager.playSound(config.SOUNDS.TORCH, 1, true);
    });

    audioManager.loadSound(config.SOUNDS.GAME_OVER);

    // Load floor texture
    loadImage(config.TEXTURES.FLOOR).then((img) => {
      this.floorTexture = img;
    });

    this._bulletManager = new BulletManager();
  }

  initPlayer(position: IPoint, rotation: number = 0): void {
    this._player = new this._Player(this, position, rotation);
  }

  addOtherPlayer(player: SessionPlayer): void {
    const point = new Point2D(player.position.x, player.position.y);
    this._otherPlayers[player.player_id] = new this._OtherPlayer(
      this,
      point,
      player.position.rotation,
      player.player_id,
      player.name
    );
  }

  removeOtherPlayer(playerId: string): void {
    delete this._otherPlayers[playerId];
  }

  updateOtherPlayerPosition(
    playerId: string,
    position: IPoint,
    rotation: number,
    date: number
  ): void {
    const player = this._otherPlayers[playerId];
    if (!player) {
      return;
    }

    if (this._otherPlayersPositionUpdateMap.has(player)) {
      const lastUpdateDate = this._otherPlayersPositionUpdateMap.get(player)!;
      if (date <= lastUpdateDate) {
        return;
      }
    }

    this._otherPlayersPositionUpdateMap.set(player, date);

    player.moveTo(position);
    player.rotate(rotation);
  }

  private getChunkKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  private getChunkLeftTop(worldPoint: IPoint): IPoint {
    return new Point2D(
      Math.floor(worldPoint.x / this.CHUNK_SIZE),
      Math.floor(worldPoint.y / this.CHUNK_SIZE)
    );
  }

  private getPlayerChunkLeftTop(): IPoint {
    if (!this._player) {
      return new Point2D(0, 0);
    }

    return this.getChunkLeftTop(this._player.getPosition());
  }

  private generateWallsForChunk(chunkPoint: IPoint): void {
    if (!this._player) {
      return;
    }

    const chunkKey = this.getChunkKey(chunkPoint.x, chunkPoint.y);
    // Mark chunk as generated
    this.generatedChunks.add(chunkKey);

    // Calculate chunk boundaries
    const chunkStartX = chunkPoint.x * this.CHUNK_SIZE;
    const chunkStartY = chunkPoint.y * this.CHUNK_SIZE;
    const newWalls: IWall[] = [];
    const newEnemies: IEnemy[] = [];

    // Generate random walls in this chunk, corresponding to the crowdedness factor
    const numWalls =
      Math.floor(Math.random() * this.crowdednessFactor) +
      this.crowdednessFactor;
    const neighboringWalls = this._walls;
    const safePaddingAroundPlayer = this.torchRadius + 40;

    for (let i = 0; i < numWalls; i++) {
      // Randomly decide wall orientation
      const orientation = Math.random() < 0.5 ? "vertical" : "horizontal";
      let x: number, y: number, width: number, height: number;

      if (orientation === "vertical") {
        x = Math.floor(
          Math.random() * (this.CHUNK_SIZE - 200) + chunkStartX + 100
        );
        y = Math.floor(
          Math.random() * (this.CHUNK_SIZE - 300) + chunkStartY + 100
        );
        width = 30;
        height = Math.floor(Math.random() * 101) + 200; // 200-300
      } else {
        x = Math.floor(
          Math.random() * (this.CHUNK_SIZE - 300) + chunkStartX + 100
        );
        y = Math.floor(
          Math.random() * (this.CHUNK_SIZE - 200) + chunkStartY + 100
        );
        width = Math.floor(Math.random() * 101) + 200; // 200-300
        height = 30;
      }

      const newNeighbors = neighboringWalls.concat(newWalls);
      // Check if the wall overlaps with existing walls
      let overlaps = false;
      for (const wall of newNeighbors) {
        const rect1 = wall.getCollisionRect();
        const rect2 = {
          left: x - width / 2,
          top: y - height / 2,
          width,
          height,
        };

        // Add padding to prevent walls from being too close
        const padding = 40;
        if (
          rect1.left < rect2.left + rect2.width + padding &&
          rect1.left + rect1.width + padding > rect2.left &&
          rect1.top < rect2.top + rect2.height + padding &&
          rect1.top + rect1.height + padding > rect2.top
        ) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        const wall = new this._Wall(
          this,
          new Point2D(x, y),
          width,
          height,
          orientation
        );

        if (
          wall.checkCollision(
            this._player.x - safePaddingAroundPlayer,
            this._player.y - safePaddingAroundPlayer,
            safePaddingAroundPlayer * 2,
            safePaddingAroundPlayer * 2
          )
        ) {
          continue;
        }

        newWalls.push(wall);

        // Create enemy for each wall
        const enemy = new this._Enemy(this, wall, neighboringWalls);
        newEnemies.push(enemy);
      }
    }

    // Store chunk data
    this.chunks.set(chunkKey, {
      x: chunkPoint.x,
      y: chunkPoint.y,
      walls: newWalls,
      enemies: newEnemies,
      bonuses: [],
    });
  }

  public unpackChunksFromSession(chunks: Record<string, SessionChunk>): void {
    for (const chunk of Object.values(chunks)) {
      this.generatedChunks.add(this.getChunkKey(chunk.x, chunk.y));
      this.chunks.set(
        this.getChunkKey(chunk.x, chunk.y),
        this.sessionChunkToChunk(chunk)
      );
    }
  }

  private sessionChunkToChunk(chunk: SessionChunk): IChunk {
    const wallMap = new Map<string, IWall>();

    return {
      x: chunk.x,
      y: chunk.y,
      walls: Object.values(chunk.objects)
        .filter((object) => object.type === "wall")
        .map((object) => {
          const point = new Point2D(object.x, object.y);
          const width = object.properties.width;
          const height = object.properties.height;
          const orientation = object.properties.orientation;

          const wall = new this._Wall(
            this,
            point,
            width,
            height,
            orientation,
            object.object_id
          );

          wallMap.set(`${object.properties.id}`, wall);

          return wall;
        }),
      enemies: Object.values(chunk.objects)
        .filter((object) => object.type === "enemy")
        .map((object) => {
          const enemy = new this._Enemy(
            this,
            wallMap.get(`${object.properties.wall_id}`)!,
            [],
            object.object_id
          );
          enemy.getPosition().setTo(object.x, object.y);
          if (object.properties.dead) {
            enemy.die(false);
          }

          return enemy;
        }),
      bonuses: Object.values(chunk.objects)
        .filter((object) => object.type === "bonus")
        .map((object) => {
          return new this._Bonus(
            this,
            new Point2D(object.x, object.y),
            object.properties.type,
            object.object_id
          );
        }),
    };
  }

  private chunkToSessionChunk(chunk: IChunk): SessionChunk {
    return {
      chunk_id: this.getChunkKey(chunk.x, chunk.y),
      x: chunk.x,
      y: chunk.y,
      objects: chunk.walls
        .map(
          (wall): SessionObject => ({
            object_id: wall.id,
            type: "wall",
            x: wall.x,
            y: wall.y,
            properties: {
              id: wall.id,
              width: wall.width,
              height: wall.height,
              orientation: wall.orientation,
            },
          })
        )
        .concat(
          chunk.enemies.map(
            (enemy): SessionObject => ({
              object_id: enemy.id,
              type: "enemy",
              x: enemy.x,
              y: enemy.y,
              properties: {
                wall_id: enemy.wall.id,
                width: enemy.width,
                height: enemy.height,
                rotation: enemy.rotation,
                dead: !enemy.isAlive(),
              },
            })
          )
        )
        .concat(
          chunk.bonuses.map(
            (bonus): SessionObject => ({
              object_id: bonus.id,
              type: "bonus",
              x: bonus.x,
              y: bonus.y,
              properties: {
                type: bonus.type,
              },
            })
          )
        )
        .reduce(
          (acc, object: SessionObject) => {
            acc[object.object_id] = object;
            return acc;
          },
          {} as Record<string, SessionObject>
        ),
    };
  }

  private updateChunks(): void {
    if (!this._player || this.paused) {
      return;
    }

    // Get current chunk coordinates
    const chunkPoint = this.getPlayerChunkLeftTop();
    if (
      this._currentPlayerChunk &&
      chunkPoint.equals(this._currentPlayerChunk)
    ) {
      return;
    }

    this._currentPlayerChunk = chunkPoint.clone();

    const updates: IChunk[] = [];

    // Generate walls for current and adjacent chunks
    const walls: IWall[] = [];
    const enemies: IEnemy[] = [];
    const bonuses: IBonus[] = [];

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const currentChunkPoint = chunkPoint.movedBy(dx, dy);
        const chunkKey = this.getChunkKey(
          currentChunkPoint.x,
          currentChunkPoint.y
        );

        if (!this.generatedChunks.has(chunkKey)) {
          this.generateWallsForChunk(currentChunkPoint);
          updates.push(this.chunks.get(chunkKey)!);
        }

        const chunk = this.chunks.get(chunkKey)!;
        walls.push(...chunk.walls);
        enemies.push(...chunk.enemies);
        bonuses.push(...chunk.bonuses);
      }
    }

    this._walls = walls;
    this._enemies = enemies;
    this._bonuses = bonuses;

    if (updates.length) {
      this._sessionManager.addSessionChunks({
        chunks: updates.map((chunk) => this.chunkToSessionChunk(chunk)),
      });
    }
  }

  update(dt: number): void {
    if (this.gameOver || this.paused) return;

    // Update player
    if (this._player) {
      // Update chunks based on player position, also cache nearby objects
      this.updateChunks();

      this._player.update(dt);

      // Update camera position
      this._cameraPoint = this._player.getPosition().clone();
    }

    this.otherPlayers.forEach((otherPlayer) => {
      otherPlayer.update(dt);
    });

    if (this._multiplayerMode === "host") {
      // Update enemies
      this._enemies.forEach((enemy) => enemy.update(dt));

      // Check bonus pickups
      this._bonuses.forEach((bonus) => bonus.update(dt));
    }

    this._bulletManager.update(dt);

    // Check win/lose conditions
    if (this._player && !this._player.isAlive()) {
      this.endGame();
    }
  }

  endGame(): void {
    if (!this._gameOver) {
      this._gameOver = true;
      AudioManager.getInstance().playSound(config.SOUNDS.GAME_OVER);
    }
  }

  drawFloor(ctx: CanvasRenderingContext2D): void {
    // Draw floor texture
    if (this.floorTexture) {
      const resultingFloorWidth = this.floorTexture.width / 2;
      const resultingFloorHeight = this.floorTexture.height / 2;

      const textureX =
        (this.cameraPoint.x % resultingFloorWidth) - resultingFloorWidth;
      const textureY =
        (this.cameraPoint.y % resultingFloorHeight) - resultingFloorHeight;

      for (
        let y = -1;
        y < config.SCREEN_HEIGHT / resultingFloorHeight + 2;
        y++
      ) {
        for (
          let x = -1;
          x < config.SCREEN_WIDTH / resultingFloorWidth + 2;
          x++
        ) {
          ctx.drawImage(
            this.floorTexture,
            -textureX - x * resultingFloorWidth,
            -textureY - y * resultingFloorHeight,
            resultingFloorWidth,
            resultingFloorHeight
          );
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Clear the canvas
    ctx.clearRect(0, 0, config.SCREEN_WIDTH, config.SCREEN_HEIGHT);

    this.drawFloor(ctx);

    // Draw walls
    this._walls.forEach((wall) => wall.draw(ctx));

    // Draw enemies
    this._enemies.forEach((enemy) => enemy.draw(ctx));

    // Draw bullets
    this._bulletManager.draw(ctx);

    // Draw bonuses
    this._bonuses.forEach((bonus) => bonus.draw(ctx));

    Object.values(this._otherPlayers).forEach((otherPlayer) => {
      otherPlayer.draw(ctx);
    });

    // Draw player
    if (this._player) {
      this._player.draw(ctx);
    }

    // Draw darkness overlay
    this.drawDarknessOverlay(ctx);

    // Draw UI
    this.drawUI(ctx);
  }

  private drawDarknessOverlay(ctx: CanvasRenderingContext2D): void {
    if (!this._player || !this._player.isAlive()) {
      ctx.fillStyle = config.COLOR_DARK;
      ctx.fillRect(0, 0, config.SCREEN_WIDTH, config.SCREEN_HEIGHT);
      return;
    }

    const torchRadius =
      this._torchRadius * 0.97 + Math.random() * this._torchRadius * 0.06;

    const torchPoint = this.worldToScreenCoordinates(
      this._player.getTorchPoint()
    );

    const gradient = ctx.createRadialGradient(
      torchPoint.x,
      torchPoint.y,
      0,
      torchPoint.x,
      torchPoint.y,
      torchRadius
    );

    if (this._player.nightVisionTimer > 0) {
      const color =
        this._player.nightVisionTimer < 2 &&
        this._player.nightVisionTimer % 0.2 < 0.1
          ? config.COLOR_NIGHT_VISION_FADING
          : config.COLOR_NIGHT_VISION;

      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color);
    } else {
      gradient.addColorStop(0, config.COLOR_TRANSPARENT);
      gradient.addColorStop(1, config.COLOR_DARK);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, config.SCREEN_WIDTH, config.SCREEN_HEIGHT);
  }

  public worldToScreenCoordinates(point: IPoint): IPoint {
    return point.movedBy(
      config.SCREEN_WIDTH / 2 - this._cameraPoint.x,
      config.SCREEN_HEIGHT / 2 - this._cameraPoint.y
    );
  }

  handleInput(keys: Set<string>, dt: number): void {
    if (!this._player) {
      return;
    }

    const currentPlayerPosition = this._player.getPosition().clone();
    const currentPlayerRotation = this._player.rotation;

    this._player.handleInput(keys, dt);

    if (
      !currentPlayerPosition.equals(this._player.getPosition()) ||
      currentPlayerRotation !== this._player.rotation
    ) {
      this._sessionManager.notifyPositionUpdate(this._player);
    }
  }

  togglePause(): void {
    this._paused = !this.paused;
  }

  restart(): void {
    this._gameOver = false;
    this._player = new this._Player(this, new Point2D(0, 0));
  }

  private drawUI(ctx: CanvasRenderingContext2D): void {
    if (!this._player) {
      return;
    }

    ctx.textAlign = "left";

    if (this.gameOver) {
      ctx.fillStyle = "white";
      ctx.font = `48px ${config.HEADER_FONT_NAME}`;
      ctx.textAlign = "center";
      ctx.fillText(
        "Game Over",
        config.SCREEN_WIDTH / 2,
        config.SCREEN_HEIGHT / 2
      );
      ctx.font = `24px ${config.FONT_NAME}`;
      ctx.fillStyle = "yellow";
      ctx.fillText(
        `Your posthumous royalties: ${this._player.money.toFixed(0)}$`,
        config.SCREEN_WIDTH / 2,
        config.SCREEN_HEIGHT / 2 + 40
      );
      ctx.fillStyle = "magenta";
      ctx.fillText(
        "Press R to Restart",
        config.SCREEN_WIDTH / 2,
        config.SCREEN_HEIGHT / 2 + 80
      );
    } else {
      ctx.fillStyle = "white";
      ctx.font = `22px ${config.FONT_NAME}`;
      ctx.fillText(
        `Lives: ${Array(this._player.lives).fill("❤️").join(" ")}`,
        10,
        30
      );
      ctx.fillStyle = "yellow";
      ctx.fillText(`Rewards: ${this._player.money.toFixed(0)}$`, 10, 60);
      ctx.fillStyle = "cyan";
      ctx.fillText(
        `Bullets: ${Array(this._player.bulletsLeft).fill("⏽").join("")}`,
        10,
        90
      );
      if (this._player.nightVisionTimer > 0) {
        ctx.fillStyle = "#90ff90";
        ctx.fillText(
          `Night Vision: ${this._player.nightVisionTimer.toFixed(0)}`,
          10,
          120
        );
      }
    }

    this._player.drawUI(ctx);

    if (this.debug) {
      ctx.fillStyle = "white";
      ctx.font = `12px ${config.FONT_NAME}`;
      ctx.fillText(
        `Chunk: ${this.getChunkLeftTop(this.cameraPoint)}`,
        10,
        config.SCREEN_HEIGHT - 52
      );
      ctx.fillText(
        `Number of world objects: ${ScreenObject.objectCount}`,
        10,
        config.SCREEN_HEIGHT - 66
      );
      ctx.fillText(
        `Camera position: ${this.cameraPoint}`,
        10,
        config.SCREEN_HEIGHT - 80
      );
      ctx.fillText(
        `Number of chunks: ${this.chunks.size}`,
        10,
        config.SCREEN_HEIGHT - 94
      );
      ctx.fillText(
        `Host: ${this._sessionManager.getCurrentSession()?.host.username}`,
        10,
        config.SCREEN_HEIGHT - 108
      );
      ctx.fillText(
        `Session ID: ${this._sessionManager.getCurrentSession()?._id}`,
        10,
        config.SCREEN_HEIGHT - 122
      );
      ctx.fillText(
        `Session: ${this._sessionManager.getCurrentSession()?.name}`,
        10,
        config.SCREEN_HEIGHT - 136
      );
    }
  }

  spawnBonus(type: BonusType, point: IPoint): void {
    const bonus = new this._Bonus(this, point, type);
    const bonusChunkPoint = this.getChunkLeftTop(point);
    const bonusChunk = this.chunks.get(
      this.getChunkKey(bonusChunkPoint.x, bonusChunkPoint.y)
    )!;

    bonusChunk.bonuses.push(bonus);
    this._bonuses.push(bonus);

    this._sessionManager.updateSessionChunk(
      this.chunkToSessionChunk(bonusChunk)
    );
  }

  removeBonus(bonus: IBonus): void {
    const bonusChunkPoint = this.getChunkLeftTop(bonus.getPosition());
    const bonusChunk = this.chunks.get(
      this.getChunkKey(bonusChunkPoint.x, bonusChunkPoint.y)
    )!;

    bonusChunk.bonuses = bonusChunk.bonuses.filter((b) => b.id !== bonus.id);
    this._bonuses = this._bonuses.filter((b) => b.id !== bonus.id);

    this._sessionManager.updateSessionChunk(
      this.chunkToSessionChunk(bonusChunk)
    );
  }

  removeEnemy(enemy: IEnemy): void {
    const enemyChunkPoint = this.getChunkLeftTop(enemy.wall.getPosition());
    const enemyChunk = this.chunks.get(
      this.getChunkKey(enemyChunkPoint.x, enemyChunkPoint.y)
    )!;

    enemyChunk.enemies = enemyChunk.enemies.filter((e) => e.id !== enemy.id);
    this._enemies = this._enemies.filter((e) => e.id !== enemy.id);

    this._sessionManager.updateSessionChunk(
      this.chunkToSessionChunk(enemyChunk)
    );
  }
}
