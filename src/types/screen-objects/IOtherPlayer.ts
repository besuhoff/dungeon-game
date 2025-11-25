import { IPoint } from "../geometry/IPoint";
import { IWorld } from "../IWorld";
import { IDamageable } from "./IDamageable";
import { IDrawable } from "./IDrawable";
import { IKillable } from "./IKillable";
import { IScreenObject } from "./IScreenObject";
import { IShooter } from "./IShooter";
import { IUpdatable } from "./IUpdatable";

export interface IOtherPlayer extends IScreenObject, IDrawable, IDamageable, IKillable, IUpdatable, IShooter {
    moveTo(point: IPoint): void;
    rotate(angle: number): void;
    drawUI(ctx: CanvasRenderingContext2D): void;
    rotation: number;
}

export interface IOtherPlayerFactory {
    new(world: IWorld, point: IPoint, rotation: number, id: string, name: string): IOtherPlayer;
}

