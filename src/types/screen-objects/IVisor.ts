import { IPoint } from "../geometry/IPoint";

export interface IVisor {
  hasNightVision(): boolean;
  isNightVisionFading(): boolean;
  getTorchPoint(): IPoint;
  get nightVisionTimer(): number;
}
