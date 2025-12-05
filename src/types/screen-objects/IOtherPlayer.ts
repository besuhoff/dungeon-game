import { IPoint } from "../geometry/IPoint";
import { IWorld } from "../IWorld";
import { IDamageable } from "./IDamageable";
import { IDrawable } from "./IDrawable";
import { IKillable } from "./IKillable";
import { IScreenObject } from "./IScreenObject";
import { IUpdatable } from "./IUpdatable";
import { IVisor } from "./IVisor";
import { Player as PlayerMessage } from "../socketEvents";

export interface IOtherPlayer
  extends IScreenObject,
    IDrawable,
    IDamageable,
    IKillable,
    IUpdatable,
    IVisor {
  moveTo(point: IPoint): void;
  rotate(angle: number): void;
  drawUI(ctx: CanvasRenderingContext2D): void;
  rotation: number;
  get name(): string;
  applyFromGameState(changeset: PlayerMessage): void;
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
