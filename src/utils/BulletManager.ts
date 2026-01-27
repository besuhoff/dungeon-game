import * as config from "../config";
import { IWorld } from "../types/IWorld";
import { IBullet } from "../types/screen-objects/IBullet";
import { IBulletManager } from "../types/screen-objects/IBulletManager";
import { AudioManager } from "./AudioManager";
import { Bullet as BulletMessage } from "../types/socketEvents";
import { Bullet } from "../entities/Bullet";

export class BulletManager implements IBulletManager {
  private _bullets: Map<string, IBullet> = new Map();
  private _bulletsSoundCache: Set<string> = new Set();
  private _bulletsRemovedSoundCache: Set<string> = new Set();

  get bullets(): IBullet[] {
    return Array.from(this._bullets.values());
  }

  constructor(private world: IWorld) {}

  getBulletCacheKey(bulletData: BulletMessage): string {
    let cacheKey = `${bulletData.id}`;

    if (bulletData.weaponType === "shotgun" && !bulletData.isActive) {
      cacheKey = `${bulletData.ownerId}-${bulletData.deletedAt}`;
    }
    return cacheKey;
  }

  applyFromGameState(bulletData: BulletMessage, remove?: boolean): void {
    const bullet = Bullet.fromGameState(this.world, bulletData);

    if (remove && bullet.active) {
      this._bullets.delete(bullet.id);
      return;
    }

    let bulletPosition = bullet.getPosition();
    if (bullet.weaponType === "railgun") {
      bulletPosition = bulletPosition
        .clone()
        .moveBy(bullet.velocity.x, bullet.velocity.y);
    }

    // Play sound
    const distance = bulletPosition.distanceTo(
      this.world.player!.getPosition(),
    );
    const maxDistance = config.SIGHT_RADIUS;
    const volume =
      distance >= maxDistance
        ? 0
        : 1 -
          Math.sqrt(distance) /
            Math.sqrt(maxDistance); // Volume decreases with the square root of the distance

    const cacheKey = this.getBulletCacheKey(bulletData);

    // Avoid playing sound multiple times for shotgun pellets of the same shot
    if (bulletData.isJustSpawned && !this._bulletsSoundCache.has(cacheKey)) {
      this._bulletsSoundCache.add(cacheKey);
      AudioManager.getInstance().playSound(
        config.BULLET_SOUND_BY_WEAPON_TYPE[
          bullet.weaponType as config.WeaponType
        ],
        { volume },
      );
    }

    if (!bullet.active) {
      const lifetime =
        config.BULLET_AFTERLIFE_MS_BY_WEAPON_TYPE[bullet.weaponType];
      const millisecondsPassed = Math.max(0, Date.now() - bullet.deletedAt);
      if (millisecondsPassed >= lifetime) {
        this._bullets.delete(bullet.id);
        return;
      }

      if (bullet.weaponType === "rocket_launcher") {
        if (!this._bulletsRemovedSoundCache.has(cacheKey)) {
          console.log("Playing sound for bullet at volume", volume);
          AudioManager.getInstance().playSound(config.SOUNDS.ROCKET_BLAST, {
            volume,
            offset: millisecondsPassed / 1000,
          });
          this._bulletsRemovedSoundCache.add(cacheKey);
        }
      }
    }

    this._bullets.set(bullet.id, bullet);
  }

  getBulletById(bulletId: string): IBullet | null {
    return this._bullets.get(bulletId) || null;
  }

  hasSoundPlayedForBullet(bulletData: BulletMessage): boolean {
    const cacheKey = this.getBulletCacheKey(bulletData);
    return this._bulletsSoundCache.has(cacheKey);
  }

  draw(ctx: CanvasRenderingContext2D, uiCtx: CanvasRenderingContext2D): void {
    this.bullets.forEach((bullet) => {
      if (!bullet.active) {
        const lifetime =
          config.BULLET_AFTERLIFE_MS_BY_WEAPON_TYPE[bullet.weaponType];
        const millisecondsPassed = Math.max(0, Date.now() - bullet.deletedAt);
        if (millisecondsPassed >= lifetime) {
          this._bullets.delete(bullet.id);
          this._bulletsSoundCache.delete(bullet.id);
          this._bulletsRemovedSoundCache.delete(bullet.id);
          return;
        }
        bullet.draw(ctx, uiCtx, millisecondsPassed);
      } else {
        bullet.draw(ctx, uiCtx);
      }
    });
  }
}
