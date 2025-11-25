import { IUpdatable } from "./IUpdatable";
import { IDrawable } from "./IDrawable";
import { IWorld } from "../IWorld";
import { IDamageable } from "./IDamageable";
import { IKillable } from "./IKillable";
import { IShooter } from "./IShooter";
import { IScreenObject } from "./IScreenObject";
import { IWall } from "./IWall";
import { IPlayer } from "./IPlayer";

export interface IEnemy
  extends IScreenObject,
    IDrawable,
    IUpdatable,
    IDamageable,
    IKillable,
    IShooter {
  canSeePlayer(player: IPlayer): boolean;
  rotation: number;
  wall: IWall;
}

export interface IEnemyFactory {
  new (
    world: IWorld,
    wall: IWall,
    neighboringWalls: IWall[],
    id?: string
  ): IEnemy;
}
