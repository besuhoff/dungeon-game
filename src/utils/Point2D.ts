import { IPoint } from "../types";

export class Point2D implements IPoint {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    toString(): string {
        return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }

    clone(): IPoint {
        return new Point2D(this.x, this.y);
    }

    moveBy(dx: number, dy: number): Point2D {
        this.x += dx;
        this.y += dy;
        return this;
    }

    movedBy(dx: number, dy: number): Point2D {
        return this.clone().moveBy(dx, dy);
    }

    moveByPointCoordinates(point: Point2D): Point2D {
        return this.moveBy(point.x, point.y);
    }

    movedByPointCoordinates(point: Point2D): Point2D {
        return this.clone().moveByPointCoordinates(point);
    }

    invertAgainstPointCoordinates(center: Point2D): Point2D {
        return this.moveBy(2 * (center.x - this.x), 2 * (center.y - this.y));
    }

    invertedAgainstPointCoordinates(center: Point2D): Point2D {
        return this.clone().invertAgainstPointCoordinates(center);
    }

    invert(): Point2D {
        return this.invertAgainstPointCoordinates(new Point2D(0, 0));
    }

    inverted(): Point2D {
        return this.clone().invert();
    }

    rotateAroundPointCoordinates(center: Point2D, angle: number): Point2D {
        const cos = Math.cos(angle * Math.PI / 180);
        const sin = Math.sin(angle * Math.PI / 180);
        const dx = this.x - center.x;
        const dy = this.y - center.y;
        this.x = dx * cos - dy * sin + center.x;
        this.y = dx * sin + dy * cos + center.y;
        return this;
    }

    rotatedAroundPointCoordinates(center: Point2D, angle: number): Point2D {
        return this.clone().rotateAroundPointCoordinates(center, angle);
    }

    rotate(angle: number): Point2D {
        return this.rotateAroundPointCoordinates(new Point2D(0, 0), angle);
    }

    rotated(angle: number): Point2D {
        return this.clone().rotate(angle);
    }

    distanceTo(point: IPoint): number {
        return Math.sqrt((this.x - point.x) ** 2 + (this.y - point.y) ** 2);
    }
}