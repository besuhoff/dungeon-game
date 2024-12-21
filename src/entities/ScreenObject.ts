import { IScreenObject, IPoint } from "../types";

export class ScreenObject implements IScreenObject {

    private static _id: number = 0;
    private _id: number;

    static get id(): number {
        return ScreenObject._id;
    }

    get id(): number {
        return this._id;
    }

    constructor(protected _point: IPoint, protected _width: number, protected _height: number) {
        ScreenObject._id++;
        this._id = ScreenObject._id;
    }

    get x(): number {
        return this._point.x;
    }

    get y(): number {
        return this._point.y;
    }

    get width(): number {
        return this._width;
    }

    get height(): number {
        return this._height;
    }

    getPosition(): IPoint {
        return this._point;
    }

    moveBy(dx: number, dy: number): void {
        this._point.moveBy(dx, dy);
    }

    getCollisionRect(dx: number = 0, dy: number = 0): { left: number; top: number; width: number; height: number } {
        return { left: this.x - this.width / 2 + dx, top: this.y - this.height / 2 + dy, width: this.width, height: this.height };
    }

    checkCollision(x: number, y: number, width: number, height: number): boolean {
        const rect = this.getCollisionRect();

        return rect.left < x + width &&
            rect.left + rect.width > x &&
            rect.top < y + height &&
            rect.top + rect.height > y;
    }

    checkCollisionWithObject(obj: IScreenObject): boolean {
        const collisionRect = obj.getCollisionRect();
        return this.checkCollision(collisionRect.left, collisionRect.top, collisionRect.width, collisionRect.height);
    }
}
