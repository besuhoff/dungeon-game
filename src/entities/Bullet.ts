import { ScreenObject } from "./ScreenObject";
import { Vector2D } from "../utils/geometry/Vector2D";
import * as config from "../config";
import { IEnemy } from "../types/screen-objects/IEnemy";
import { IBullet } from "../types/screen-objects/IBullet";
import { IPoint } from "../types/geometry/IPoint";
import { IWorld } from "../types/IWorld";
import { SessionManager } from "../api/SessionManager";
import { IO } from "inspector/promises";
import { IOtherPlayer } from "../types/screen-objects/IOtherPlayer";

export class Bullet extends ScreenObject implements IBullet {
  private _velocity: Vector2D;
  private _speed: number;
  private _active: boolean = true;
  private _damage: number;

  get active(): boolean {
    return this._active;
  }

  get velocity(): Vector2D {
    return this._velocity;
  }

  constructor(
    private world: IWorld,
    point: IPoint,
    private rotation: number,
    public readonly isEnemy: boolean,
    public readonly ownerId?: string,
    id?: string
  ) {
    super(point, config.BULLET_SIZE, config.BULLET_SIZE, id);
    this._damage = config.BULLET_DAMAGE;
    this._speed = isEnemy
      ? config.ENEMY_BULLET_SPEED
      : config.PLAYER_BULLET_SPEED;
    this._velocity = Vector2D.fromAngle((rotation * Math.PI) / 180).multiply(
      this._speed
    );
  }

  update(dt: number): void {
    if (!this._active) return;

    // Calculate movement based on velocity and delta time
    const dx = this._velocity.x * dt;
    const dy = this._velocity.y * dt;

    // Check collisions with walls
    const collisionRect = this.getCollisionRect(dx, dy);

    let collision = false;
    for (const wall of this.world.walls) {
      if (
        wall.checkCollision(
          collisionRect.left,
          collisionRect.top,
          collisionRect.width,
          collisionRect.height
        )
      ) {
        collision = true;
        break;
      }
    }

    if (collision) {
      this._active = false;
    } else {
      this.moveBy(dx, dy);

      // Check hits with enemies
      const hitEnemies = this.checkHitsEnemies();
      if (hitEnemies.length > 0) {
        hitEnemies.forEach((enemy) => enemy.takeDamage(this._damage));
        this._active = false;
      }

      // Check hits with player
      if (this.world.player && this.checkHitsPlayer()) {
        this.world.player.takeDamage(this._damage);
        this._active = false;
      }

      // Check hits with other players
      const hitOtherPlayers = this.checkHitsOtherPlayers();
      if (hitOtherPlayers.length > 0) {
        hitOtherPlayers.forEach((otherPlayer) =>
          otherPlayer.takeDamage(this._damage)
        );
        this._active = false;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this._active) return;

    const screenPoint = this.world.worldToScreenCoordinates(this.getPosition());

    ctx.save();
    ctx.translate(screenPoint.x, screenPoint.y);
    ctx.rotate((this.rotation * Math.PI) / 180);

    // Draw bullet
    ctx.fillStyle = this.isEnemy
      ? config.ENEMY_BULLET_COLOR
      : config.PLAYER_BULLET_COLOR;
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  checkHitsEnemies(): IEnemy[] {
    if (this.isEnemy) {
      return [];
    }

    return this.world.enemies.filter(
      (enemy) => enemy.isAlive() && this.checkCollisionWithObject(enemy)
    );
  }

  checkHitsPlayer(): boolean {
    return Boolean(
      this.isEnemy &&
        this.world.player &&
        this.world.player.isAlive() &&
        this.checkCollisionWithObject(this.world.player)
    );
  }

  checkHitsOtherPlayers(): IOtherPlayer[] {
    if (!this.isEnemy) {
      return [];
    }

    return this.world.otherPlayers.filter(
      (otherPlayer) =>
        otherPlayer.isAlive() && this.checkCollisionWithObject(otherPlayer)
    );
  }
}
