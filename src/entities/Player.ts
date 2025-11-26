import { ScreenObject } from "./ScreenObject";
import * as config from "../config";
import { IPlayer } from "../types/screen-objects/IPlayer";
import { IBullet } from "../types/screen-objects/IBullet";
import { IPoint } from "../types/geometry/IPoint";
import { IWorld } from "../types/IWorld";
import { Bullet } from "./Bullet";
import { loadImage } from "../utils/loadImage";
import { AudioManager } from "../utils/AudioManager";
import { AuthManager } from "../api/AuthManager";
import { SessionManager } from "../api/SessionManager";

export class Player extends ScreenObject implements IPlayer {
  private _nightVisionTimer: number = 0;
  private _speed: number = config.PLAYER_SPEED;
  private _image: HTMLImageElement | null = null;
  private _rotation: number = 0;
  private _rotationSpeed: number = config.PLAYER_ROTATION_SPEED;
  private _bullets: IBullet[] = [];
  private _bulletsLeft: number = config.PLAYER_MAX_BULLETS;
  private _kills: number = 0;
  private _money: number = 0;

  private _shootDelay: number = 0;
  private _invulnerableTimer: number = 0;
  private _rechargeAccumulator: number = 0;

  private _debugData: {
    collisionHits?: { id: string; total: boolean; x: boolean; y: boolean }[];
    coordinates?: {
      dx: number;
      dy: number;
    };
  } = {};
  private _lives: number = config.PLAYER_LIVES;

  get money(): number {
    return this._money;
  }

  get kills(): number {
    return this._kills;
  }

  get bulletsLeft(): number {
    return this._bulletsLeft;
  }

  get rotation(): number {
    return this._rotation;
  }

  get nightVisionTimer(): number {
    return this._nightVisionTimer;
  }

  constructor(
    private world: IWorld,
    point: IPoint,
    rotation: number,
    id: string = ""
  ) {
    super(point, config.PLAYER_SIZE, config.PLAYER_SIZE, id);

    this._rotation = rotation;

    // Load sounds
    const audioManager = AudioManager.getInstance();
    audioManager.loadSound(config.SOUNDS.BULLET);
    audioManager.loadSound(config.SOUNDS.PLAYER_HURT);
    audioManager.loadSound(config.SOUNDS.PLAYER_BULLET_RECHARGE);

    // Load player sprite
    const texturePath = config.TEXTURES.PLAYER;
    loadImage(texturePath).then((img) => {
      this._image = img;
    });
  }

  getGunPoint(): IPoint {
    // Get gun position
    return this.getPosition()
      .movedByPointCoordinates(config.PLAYER_TEXTURE_CENTER.inverted())
      .moveByPointCoordinates(config.PLAYER_GUN_END)
      .rotateAroundPointCoordinates(this.getPosition(), this._rotation);
  }

  getTorchPoint(): IPoint {
    // Get gun position
    return this.getPosition()
      .movedByPointCoordinates(config.PLAYER_TEXTURE_CENTER.inverted())
      .moveByPointCoordinates(config.PLAYER_TORCH_POINT)
      .rotateAroundPointCoordinates(this.getPosition(), this._rotation);
  }

  shoot(dt: number): void {
    if (this._shootDelay > 0 || this._bulletsLeft <= 0) {
      return;
    }

    const bulletPoint = this.getGunPoint();

    // Create bullet
    const bullet = new Bullet(
      this.world,
      bulletPoint,
      this._rotation,
      false,
      AuthManager.getInstance().getUserData()?._id
    );

    SessionManager.getInstance().notifyBulletCreated(bullet);

    this._bullets.push(bullet);
    this._shootDelay = config.PLAYER_SHOOT_DELAY;
    this._bulletsLeft--;

    // Play sound
    AudioManager.getInstance().playSound(config.SOUNDS.BULLET);
  }

  private move(forward: number): void {
    if (!this.isAlive()) {
      return;
    }

    const collidableObjects = [
      ...this.world.walls,
      ...this.world.otherPlayers.filter((player) => player.isAlive()),
      ...this.world.enemies.filter((enemy) => enemy.isAlive()),
    ];

    // Convert rotation to radians for math calculations
    const rotationRad = (this._rotation * Math.PI) / 180;

    // Calculate movement vector based on rotation and delta time
    let dx = -Math.sin(rotationRad) * forward * this._speed;
    let dy = Math.cos(rotationRad) * forward * this._speed;

    // Check collisions with adjusted wall positions
    let collision = false;
    let collisionX = false;
    let collisionY = false;

    const collisionRect = this.getCollisionRect(dx, dy);
    const xCollisionRect = this.getCollisionRect(dx, 0);
    const yCollisionRect = this.getCollisionRect(0, dy);

    const hits: {
      id: string;
      total: boolean;
      x: boolean;
      y: boolean;
      toString: () => string;
    }[] = [];

    for (const obj of collidableObjects) {
      const hit = {
        id: obj.id,
        total: false,
        x: false,
        y: false,
        toString: function () {
          return `Object ID: ${this.id}, blocks Direction: ${this.total}, blocks X: ${this.x}, blocks Y: ${this.y}`;
        },
      };

      if (
        obj.checkCollision(
          collisionRect.left,
          collisionRect.top,
          collisionRect.width,
          collisionRect.height
        )
      ) {
        collision = true;
        hit.total = true;
      }

      if (
        obj.checkCollision(
          xCollisionRect.left,
          xCollisionRect.top,
          xCollisionRect.width,
          xCollisionRect.height
        )
      ) {
        collisionX = true;
        hit.x = true;
      }

      if (
        obj.checkCollision(
          yCollisionRect.left,
          yCollisionRect.top,
          yCollisionRect.width,
          yCollisionRect.height
        )
      ) {
        collisionY = true;
        hit.y = true;
      }

      if (hit.total) {
        hits.push(hit);
      }
    }

    if (collision) {
      if (collisionX) dx = 0;
      if (collisionY) dy = 0;
    }

    if (dx !== 0 || dy !== 0) {
      this.moveBy(dx, dy);
    }

    if (this.world.debug) {
      this._debugData = {
        collisionHits: hits,
        coordinates: {
          dx,
          dy,
        },
      };
    }
  }

  private rotate(angleChange: number): void {
    this._rotation = (this._rotation - angleChange * this._rotationSpeed) % 360;
  }

  takeDamage(amount: number): void {
    if (this._invulnerableTimer <= 0) {
      this._lives -= amount;
      this._invulnerableTimer = config.PLAYER_INVULNERABILITY_TIME;
      AudioManager.getInstance().playSound(config.SOUNDS.PLAYER_HURT);
    }
  }

  addNightVision(): void {
    this._nightVisionTimer += config.GOGGLES_ACTIVE_TIME;
  }

  hasNightVision(): boolean {
    return this._nightVisionTimer > 0;
  }

  isNightVisionFading(): boolean {
    return this._nightVisionTimer < 2 && this._nightVisionTimer % 0.2 < 0.1;
  }

  heal(amount: number): void {
    this._lives = Math.min(this._lives + amount, config.PLAYER_LIVES);
  }

  update(dt: number): void {
    // Update timers
    if (this._invulnerableTimer > 0) {
      this._invulnerableTimer = Math.max(0, this._invulnerableTimer - dt);
    }

    if (this._shootDelay > 0) {
      this._shootDelay = Math.max(0, this._shootDelay - dt);
    }

    if (this._nightVisionTimer > 0) {
      this._nightVisionTimer = Math.max(0, this._nightVisionTimer - dt);
    }

    this._bullets
      .filter((bullet) => bullet.active)
      .forEach((bullet) => {
        bullet.update(dt);
      });

    // Recharge bullets
    if (this._bulletsLeft < config.PLAYER_MAX_BULLETS) {
      this._rechargeAccumulator += dt;
      if (this._rechargeAccumulator >= config.PLAYER_BULLET_RECHARGE_TIME) {
        this._rechargeAccumulator -= config.PLAYER_BULLET_RECHARGE_TIME;
        this._bulletsLeft++;
        AudioManager.getInstance().playSound(
          config.SOUNDS.PLAYER_BULLET_RECHARGE,
          0.5
        );
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, uiCtx: CanvasRenderingContext2D): void {
    this._bullets.forEach((bullet) => {
      bullet.draw(ctx, uiCtx);
    });

    if (!this._image) {
      return;
    }

    const screenPoint = this.world.worldToScreenCoordinates(this.getPosition());

    ctx.save();

    // Handle invulnerability blinking
    const blinkFactor =
      (this._invulnerableTimer * 5) / config.PLAYER_INVULNERABILITY_TIME;
    const shouldBlink = blinkFactor - Math.floor(blinkFactor) < 0.5;
    const texturePoint = config.PLAYER_TEXTURE_CENTER.inverted();

    ctx.translate(screenPoint.x, screenPoint.y);

    if ((this._invulnerableTimer <= 0 || shouldBlink) && !this.world.gameOver) {
      // Draw player sprite
      ctx.rotate((this._rotation * Math.PI) / 180);
      ctx.drawImage(
        this._image,
        texturePoint.x,
        texturePoint.y,
        config.PLAYER_TEXTURE_SIZE,
        config.PLAYER_TEXTURE_SIZE
      );
      ctx.rotate((-this._rotation * Math.PI) / 180);
    }

    ctx.restore();

    if (this.world.debug) {
      // Draw collision box
      uiCtx.strokeStyle = "red";
      uiCtx.strokeRect(
        -this.width / 2 + screenPoint.x,
        -this.height / 2 + screenPoint.y,
        this.width,
        this.height
      );

      // Draw center point
      uiCtx.fillStyle = "magenta";
      uiCtx.beginPath();
      uiCtx.arc(screenPoint.x, screenPoint.y, 2, 0, Math.PI * 2);
      uiCtx.fill();

      // Draw gun end point
      uiCtx.fillStyle = "magenta";
      const gunPoint = this.world.worldToScreenCoordinates(this.getGunPoint());

      uiCtx.beginPath();
      uiCtx.arc(gunPoint.x, gunPoint.y, 2, 0, Math.PI * 2);
      uiCtx.fill();

      // Draw torch point
      uiCtx.fillStyle = "cyan";
      const torchPoint = this.world.worldToScreenCoordinates(
        this.getTorchPoint()
      );

      uiCtx.beginPath();
      uiCtx.arc(torchPoint.x, torchPoint.y, 2, 0, Math.PI * 2);
      uiCtx.fill();
    }
  }

  drawUI(ctx: CanvasRenderingContext2D): void {
    if (this.world.debug) {
      // Draw debug data
      ctx.fillStyle = "white";
      ctx.font = `12px ${config.FONT_NAME}`;
      ctx.textAlign = "left";
      ctx.fillText(
        `Collision hits: ${this._debugData.collisionHits}`,
        10,
        ctx.canvas.height - 38
      );
      ctx.fillText(
        `Player position: ${this.getPosition()}`,
        10,
        ctx.canvas.height - 24
      );
      ctx.fillText(`Rotation: ${this._rotation}`, 10, ctx.canvas.height - 10);
    }
  }

  handleInput(keys: Set<string>, dt: number): void {
    // Handle movement
    if (keys.has("KeyW") || keys.has("ArrowUp")) {
      this.move(dt);
    }
    if (keys.has("KeyS") || keys.has("ArrowDown")) {
      this.move(-dt);
    }

    // Handle rotation
    if (keys.has("KeyA") || keys.has("ArrowLeft")) {
      this.rotate(dt);
    }
    if (keys.has("KeyD") || keys.has("ArrowRight")) {
      this.rotate(-dt);
    }

    // Handle shooting
    if (keys.has(" ")) {
      this.shoot(dt);
    }
  }

  isAlive(): boolean {
    return this._lives > 0;
  }

  die(): void {}

  get lives(): number {
    return this._lives;
  }

  recordKill(reward: number): void {
    this._kills++;
    this._money += reward;
  }

  isInvulnerable(): boolean {
    return this._invulnerableTimer > 0;
  }
}
