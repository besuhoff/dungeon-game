import { RAY_TYPES, RayType } from "../config";
import { IWorld } from "../types/IWorld";
import { IRay } from "../types/screen-objects/IRay";
import { ScreenObject } from "./ScreenObject";
import { Ray as RayMessage, RayUpdate } from "../types/socketEvents";
import { Point2D } from "../utils/geometry/Point2D";

export class Ray extends ScreenObject implements IRay {
  private _end: Point2D;
  private _type: RayType;

  get end(): Point2D {
    return this._end;
  }

  get type(): RayType {
    return this._type;
  }

  constructor(
    private _world: IWorld,
    rayData: RayMessage,
  ) {
    const point = new Point2D(rayData.position!.x, rayData.position!.y);
    super(point, 0, 0, rayData.id);
    this._end = new Point2D(rayData.endPosition!.x, rayData.endPosition!.y);
    this._type = rayData.type as RayType;
  }

  draw(ctx: CanvasRenderingContext2D, uiCtx: CanvasRenderingContext2D): void {
    if (this._type === RAY_TYPES.LASER) {
      const start = this._world.worldToScreenCoordinates(this._point);
      const end = this._world.worldToScreenCoordinates(this._end);
      ctx.save();
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  applyFromGameStateDelta(updateData: RayUpdate): void {
    if (updateData.position) {
      this._point.setTo(updateData.position.x, updateData.position.y);
    }
    if (updateData.endPosition) {
      this._end.setTo(updateData.endPosition.x, updateData.endPosition.y);
    }
  }
}
