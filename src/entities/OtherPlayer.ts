import { ScreenObject } from "./ScreenObject";
import * as config from "../config";
import { IBullet } from "../types/screen-objects/IBullet";
import { IPoint } from "../types/geometry/IPoint";
import { IWorld } from "../types/IWorld";
import { Bullet } from "./Bullet";
import { loadImage } from "../utils/loadImage";
import { AudioManager } from "../utils/AudioManager";
import { IOtherPlayer } from "../types/screen-objects/IOtherPlayer";

export class OtherPlayer extends ScreenObject implements IOtherPlayer {
  private _image: HTMLImageElement | null = null;
  private _rotation: number = 0;
  private _bullets: IBullet[] = [];

  private _invulnerableTimer: number = 0;
  private _lives: number = config.PLAYER_LIVES;

  get rotation(): number {
    return this._rotation;
  }

  constructor(
    private world: IWorld,
    point: IPoint,
    rotation: number,
    id: string,
    private name: string
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

  registerShot(bullet: IBullet): void {
    this._bullets.push(bullet);

    // Play sound
    const distance = this.getPosition().distanceTo(
      this.world.player!.getPosition()
    );
    const maxDistance = this.world.torchRadius * 2;
    const volume = distance >= maxDistance ? 0 : 1 - distance / maxDistance;
    AudioManager.getInstance().playSound(config.SOUNDS.BULLET, volume);
  }

  moveTo(point: IPoint): void {
    this._point.setToPointCoordinates(point);
  }

  rotate(angle: number): void {
    this._rotation = angle;
  }

  takeDamage(amount: number): void {
    if (this._invulnerableTimer <= 0) {
      this._lives -= amount;
      this._invulnerableTimer = config.PLAYER_INVULNERABILITY_TIME;
      AudioManager.getInstance().playSound(config.SOUNDS.PLAYER_HURT);
    }
  }

  update(dt: number): void {
    // Update timers
    if (this._invulnerableTimer > 0) {
      this._invulnerableTimer = Math.max(0, this._invulnerableTimer - dt);
    }

    this._bullets.forEach((bullet) => {
      bullet.update(dt);
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this._bullets.forEach((bullet) => {
      bullet.draw(ctx);
    });

    if (!this._image || !this.world.player || this.world.gameOver) {
      return;
    }

    const screenPoint = this.world.worldToScreenCoordinates(this.getPosition());
    const distance = this.getPosition().distanceTo(
      this.world.player.getPosition()
    );
    const shouldDraw =
      distance <= this.world.torchRadius + this.width ||
      this.world.player.nightVisionTimer > 0;

    if (!shouldDraw) {
      return;
    }

    this.drawUI(ctx);

    // Handle invulnerability blinking
    const blinkFactor =
      (this._invulnerableTimer * 5) / config.PLAYER_INVULNERABILITY_TIME;
    const shouldBlink = blinkFactor - Math.floor(blinkFactor) < 0.5;
    const texturePoint = config.PLAYER_TEXTURE_CENTER.inverted();

    ctx.save();
    ctx.translate(screenPoint.x, screenPoint.y);

    if ((!this._invulnerableTimer || shouldBlink) && !this.world.gameOver) {
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
      ctx.strokeStyle = "red";
      ctx.strokeRect(
        -this.width / 2 + screenPoint.x,
        -this.height / 2 + screenPoint.y,
        this.width,
        this.height
      );

      // Draw center point
      ctx.fillStyle = "magenta";
      ctx.beginPath();
      ctx.arc(screenPoint.x, screenPoint.y, 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw gun end point
      ctx.fillStyle = "magenta";
      const gunPoint = this.world.worldToScreenCoordinates(this.getGunPoint());

      ctx.beginPath();
      ctx.arc(gunPoint.x, gunPoint.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  isAlive(): boolean {
    return this._lives > 0;
  }

  die(): void {}

  get lives(): number {
    return this._lives;
  }

  drawUI(ctx: CanvasRenderingContext2D): void {
    const screenPoint = this.world.worldToScreenCoordinates(this.getPosition());

    // Set font first to measure text
    ctx.font = `14px ${config.FONT_NAME}`;
    const textMetrics = ctx.measureText(this.name);

    // Draw background
    const padding = 3;
    const bgWidth = textMetrics.width + padding * 2;
    const bgHeight = textMetrics.actualBoundingBoxAscent + padding * 2; // Font size + padding

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(
      screenPoint.x - bgWidth / 2,
      screenPoint.y + this.height / 2 + 30,
      bgWidth,
      bgHeight
    );

    // Write nickname
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(
      this.name,
      screenPoint.x,
      screenPoint.y +
        this.height / 2 +
        30 +
        textMetrics.actualBoundingBoxAscent +
        padding
    );
  }
}
