import { IScreenObject } from "./IScreenObject";
import { IPoint } from "../geometry/IPoint";
import { IWorld } from "../IWorld";
import { IDrawable } from "./IDrawable";
import { IUpdatable } from "./IUpdatable";
import { Vector2D } from "../../utils/geometry/Vector2D";

export interface IBullet extends IScreenObject, IDrawable, IUpdatable {
  active: boolean;
  velocity: Vector2D;
  isEnemy: boolean;
  ownerId?: string;
}

export interface IBulletFactory {
  new (
    world: IWorld,
    point: IPoint,
    rotation: number,
    isEnemy: boolean,
    ownerId?: string,
    id?: string
  ): IBullet;
}
