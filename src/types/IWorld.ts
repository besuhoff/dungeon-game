import { IEnemy } from "./screen-objects/IEnemy";
import { IPlayer } from "./screen-objects/IPlayer";
import { IBonus, BonusType } from "./screen-objects/IBonus";
import { IWall } from "./screen-objects/IWall";
import { IPoint } from "./geometry/IPoint";
import { SessionChunk, SessionPlayer } from "./session";
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
  initPlayer(position: IPoint, rotation: number, id: string): void;
  toggleDebug(): void;
  restart(): void;
  togglePause(): void;
  update(dt: number): void;
  draw(
    ctx: CanvasRenderingContext2D,
    lightCtx: CanvasRenderingContext2D,
    uiCtx: CanvasRenderingContext2D
  ): void;
  worldToScreenCoordinates(point: IPoint): IPoint;
  spawnBonus(type: BonusType, point: IPoint): void;
  removeBonus(bonus: IBonus): void;
  removeEnemy(enemy: IEnemy): void;
  addOtherPlayer(player: SessionPlayer): void;
  removeOtherPlayer(playerId: string): void;
  respawnOtherPlayer(playerId: string): void;
  unpackChunksFromSession(chunks: Record<string, SessionChunk>): void;
}
