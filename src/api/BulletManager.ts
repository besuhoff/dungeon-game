import { IBullet } from "../types/screen-objects/IBullet";
import { IBulletManager } from "../types/screen-objects/IBulletManager";
import { IDrawable } from "../types/screen-objects/IDrawable";
import { IUpdatable } from "../types/screen-objects/IUpdatable";

export class BulletManager implements IBulletManager, IUpdatable, IDrawable {
  private _bullets: Map<string, IBullet> = new Map();

  get bullets(): IBullet[] {
    return Array.from(this._bullets.values());
  }

  registerShot(bullet: IBullet): void {
    this._bullets.set(bullet.id, bullet);
  }

  update(dt: number): void {
    this.bullets
      .filter((bullet) => bullet.active)
      .forEach((bullet) => bullet.update(dt));
  }

  draw(ctx: CanvasRenderingContext2D, uiCtx: CanvasRenderingContext2D): void {
    this.bullets
      .filter((bullet) => bullet.active)
      .forEach((bullet) => bullet.draw(ctx, uiCtx));
  }
}
