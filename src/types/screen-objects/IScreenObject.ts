import { IPoint } from "../geometry/IPoint";

export interface IScreenObject {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    getPosition(): IPoint;
    moveBy(dx: number, dy: number): void;
    getCollisionRect(): { left: number; top: number; width: number; height: number; };
    checkCollision(x: number, y: number, width: number, height: number): boolean;
}
