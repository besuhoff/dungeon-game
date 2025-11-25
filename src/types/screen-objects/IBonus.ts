import { IPoint } from "../geometry/IPoint";
import { IWorld } from "../IWorld";
import { IDrawable } from "./IDrawable";
import { IScreenObject } from "./IScreenObject";
import { IUpdatable } from "./IUpdatable";

export type BonusType = 'aid_kit' | 'goggles';export interface IBonus extends IScreenObject, IDrawable, IUpdatable {
    type: BonusType;
}

export interface IBonusFactory {
    new(world: IWorld, point: IPoint, type: BonusType, id?: string): IBonus;
}

