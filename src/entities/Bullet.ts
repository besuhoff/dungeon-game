import { ScreenObject } from "./ScreenObject";
import { Vector2D } from "../utils/geometry/Vector2D";
import * as config from "../config";
import { IBullet } from "../types/screen-objects/IBullet";
import { IPoint } from "../types/geometry/IPoint";
import { IWorld } from "../types/IWorld";

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

    this.moveBy(dx, dy);
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
}
