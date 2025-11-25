import { IWorld } from "../IWorld";
import { IScreenObject } from "./IScreenObject";
import { IPoint } from "../geometry/IPoint";
import { IDrawable } from "./IDrawable";

export interface IWall extends IScreenObject, IDrawable {
    orientation: 'vertical' | 'horizontal';
    getLeftTopCorner(): IPoint;
}

export interface IWallFactory {
    new(world: IWorld, point: IPoint, width: number, height: number, orientation: 'vertical' | 'horizontal', id?: string): IWall;
}

