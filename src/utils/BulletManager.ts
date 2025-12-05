import * as config from "../config";
import { IWorld } from "../types/IWorld";
import { IBullet } from "../types/screen-objects/IBullet";
import { IBulletManager } from "../types/screen-objects/IBulletManager";
import { AudioManager } from "./AudioManager";

export class BulletManager implements IBulletManager {
  private _bullets: Map<string, IBullet> = new Map();

  get bullets(): IBullet[] {
    return Array.from(this._bullets.values());
  }

  constructor(private world: IWorld) {}

  registerShot(bullet: IBullet): void {
    this._bullets.set(bullet.id, bullet);

    // Play sound
    const distance = bullet
      .getPosition()
      .distanceTo(this.world.player!.getPosition());
    const maxDistance = this.world.torchRadius * 2;
    const volume = distance >= maxDistance ? 0 : 1 - distance / maxDistance;
    AudioManager.getInstance().playSound(config.SOUNDS.BULLET, volume);
  }

  unregisterShot(bulletId: string): void {
    this._bullets.delete(bulletId);
  }

  getBulletById(bulletId: string): IBullet | null {
    return this._bullets.get(bulletId) || null;
  }

  draw(ctx: CanvasRenderingContext2D, uiCtx: CanvasRenderingContext2D): void {
    this.bullets
      .filter((bullet) => bullet.active)
      .forEach((bullet) => bullet.draw(ctx, uiCtx));
  }
}
