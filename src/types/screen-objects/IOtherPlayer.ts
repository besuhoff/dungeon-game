import { IPoint } from "../geometry/IPoint";
import { IWorld } from "../IWorld";
import { IDamageable } from "./IDamageable";
import { IDrawable } from "./IDrawable";
import { IKillable } from "./IKillable";
import { IScreenObject } from "./IScreenObject";
import { IBulletManager } from "./IBulletManager";
import { IUpdatable } from "./IUpdatable";
import { IVisor } from "./IVisor";

export interface IOtherPlayer
  extends IScreenObject,
    IDrawable,
    IDamageable,
    IKillable,
    IUpdatable,
    IBulletManager,
    IVisor {
  moveTo(point: IPoint): void;
  rotate(angle: number): void;
  drawUI(ctx: CanvasRenderingContext2D): void;
  rotation: number;
  get name(): string;
}

export interface IOtherPlayerFactory {
  new (
    world: IWorld,
    point: IPoint,
    rotation: number,
    id: string,
    name: string
  ): IOtherPlayer;
}
