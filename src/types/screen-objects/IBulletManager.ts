import { IBullet } from "./IBullet";

export interface IBulletManager {
  registerShot(bullet: IBullet): void;
}
