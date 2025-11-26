import { IPoint } from "../geometry/IPoint";

export interface IVisor {
  addNightVision(): void;
  hasNightVision(): boolean;
  isNightVisionFading(): boolean;
  getTorchPoint(): IPoint;
  get nightVisionTimer(): number;
}
