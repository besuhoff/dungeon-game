import { ScreenObject } from './ScreenObject';
import * as config from '../config';
import { IPoint, IWall, IWorld } from '../types';
import { loadImage } from '../utils/loadImage';

export class Wall extends ScreenObject implements IWall {
    private image: HTMLImageElement | null = null;

    constructor(private world: IWorld, point: IPoint, width: number, height: number, private _orientation: 'vertical' | 'horizontal') {
        super(point, width, height);

        loadImage(config.TEXTURES.WALL).then(img => {
            this.image = img;
        });
    }

    get orientation(): 'vertical' | 'horizontal' {
        return this._orientation;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (!this.image) {
            return;
        }

        const screenLeftTop = this.world.worldToScreenCoordinates(this.getLeftTopCorner());

        ctx.save();
        ctx.translate(screenLeftTop.x, screenLeftTop.y);

        let [width, height] = [this._width, this._height];

        if (this._orientation === 'vertical') {
            [width, height] = [this._height, this._width];
        }

        // Draw wall sprite with correct orientation
        if (this._orientation === 'vertical') {
            ctx.rotate(Math.PI / 2);
            ctx.translate(0, -this.width);
        }

        ctx.drawImage(this.image, 0, 0, width, height);

        if (this.world.debug) {
            ctx.strokeStyle = 'red';
            ctx.strokeRect(0, 0, width, height);
            ctx.fillStyle = 'white';
            ctx.font = `12px ${config.FONT_NAME}`;
            ctx.fillText(`#${this.id} ${this.getPosition()}`, 2, 12);
            ctx.fillText(`Width: ${this.width}, Height: ${this.height}`, 2, 24);
        }

        ctx.restore();

        if (this.world.debug) {
            const screenPoint = this.world.worldToScreenCoordinates(this.getPosition());

            // Draw initial point
            ctx.fillStyle = 'magenta';
            ctx.beginPath();
            ctx.arc(screenPoint.x, screenPoint.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    getCollisionRect(): { left: number; top: number; width: number; height: number } {
        const { x: left, y: top } = this.getLeftTopCorner();
        return {
            left,
            top,
            width: this._width,
            height: this.height
        };
    }

    getLeftTopCorner(): IPoint {
        let correction_w = 0;
        let correction_h = 0;
        if (this.orientation == 'vertical') {
            correction_w = this._width / 2;
        } else {
            correction_h = this.height / 2;
        }

        return this.getPosition().movedBy(-correction_w, -correction_h);
    }
}
