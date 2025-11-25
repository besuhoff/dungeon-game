import { IPoint } from "../geometry/IPoint";
import { IWorld } from "../IWorld";
import { IDamageable } from "./IDamageable";
import { IDrawable } from "./IDrawable";
import { IKillable } from "./IKillable";
import { IScreenObject } from "./IScreenObject";
import { IShooter } from "./IShooter";
import { IUpdatable } from "./IUpdatable";

export interface IPlayer extends IScreenObject, IDrawable, IUpdatable, IDamageable, IKillable, IShooter {
    recordKill(reward: number): void;
    handleInput(keys: Set<string>, dt: number): void;
    heal(amount: number): void;
    addNightVision(): void;
    drawUI(ctx: CanvasRenderingContext2D): void;
    getTorchPoint(): IPoint;
    nightVisionTimer: number;
    rotation: number;
    money: number;
    kills: number;
    bulletsLeft: number;

}

export interface IPlayerFactory {
    new(world: IWorld, point: IPoint, rotation?: number): IPlayer;
}

