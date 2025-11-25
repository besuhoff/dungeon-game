import { IPoint } from "../geometry/IPoint";

export interface IShooter {
    shoot(dt: number): void;
    getGunPoint(): IPoint;
}
