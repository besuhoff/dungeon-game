import { IEnemy } from "./screen-objects/IEnemy";
import { IPlayer } from "./screen-objects/IPlayer";
import { IBonus, BonusType } from "./screen-objects/IBonus";
import { IWall } from "./screen-objects/IWall";
import { IPoint } from "./geometry/IPoint";
import { SessionChunk } from "./session";
import { IOtherPlayer } from "./screen-objects/IOtherPlayer";

export interface IWorld {
  player: IPlayer | null;
  otherPlayers: IOtherPlayer[];
  walls: IWall[];
  enemies: IEnemy[];
  bonuses: IBonus[];
  gameOver: boolean;
  paused: boolean;
  cameraPoint: IPoint;
  torchRadius: number;
  debug: boolean;
  multiplayerMode: "host" | "guest";
  initPlayer(position: IPoint, rotation: number): void;
  toggleDebug(): void;
  restart(): void;
  togglePause(): void;
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
  worldToScreenCoordinates(point: IPoint): IPoint;
  spawnBonus(type: BonusType, point: IPoint): void;
  removeBonus(bonus: IBonus): void;
  removeEnemy(enemy: IEnemy): void;
  unpackChunksFromSession(chunks: Record<string, SessionChunk>): void;
}
