import { IBonus } from "./IBonus";
import { IEnemy } from "./IEnemy";
import { IWall } from "./IWall";

export interface IChunk {
    x: number;
    y: number;
    walls: IWall[];
    enemies: IEnemy[];
    bonuses: IBonus[];
}
