export interface IDrawable {
    draw(ctx: CanvasRenderingContext2D): void;
}

export interface IUpdatable {
    update(dt: number): void;
}

export interface IDamageable {
    takeDamage(damage?: number): void;
}

export interface IKillable {
    isAlive(): boolean;
    die(): void;
    lives: number;
}

export interface IShooter {
    shoot(dt: number): void;
    getGunPoint(): IPoint;
}

export interface IPoint {
    x: number;
    y: number;
    clone(): IPoint;
    invert(): IPoint;
    inverted(): IPoint;
    moveBy(dx: number, dy: number): IPoint;
    movedBy(dx: number, dy: number): IPoint;
    moveByPointCoordinates(point: IPoint): IPoint;
    movedByPointCoordinates(point: IPoint): IPoint;
    invertAgainstPointCoordinates(center: IPoint): IPoint;
    invertedAgainstPointCoordinates(center: IPoint): IPoint;
    rotateAroundPointCoordinates(center: IPoint, angle: number): IPoint;
    rotatedAroundPointCoordinates(center: IPoint, angle: number): IPoint;
    rotate(angle: number): IPoint;
    rotated(angle: number): IPoint;
    distanceTo(point: IPoint): number;
    toString(): string;
};

export interface IScreenObject {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    getPosition(): IPoint;
    moveBy(dx: number, dy: number): void;
    getCollisionRect(): { left: number; top: number; width: number; height: number };
    checkCollision(x: number, y: number, width: number, height: number): boolean;
}

export interface IChunk {
    x: number;
    y: number;
    walls: IWall[];
    enemies: IEnemy[];
}

export interface IWorld {
    player: IPlayer;
    walls: IWall[];
    enemies: IEnemy[];
    bonuses: IBonus[];
    gameOver: boolean;
    paused: boolean;
    cameraPoint: IPoint;
    torchRadius: number;
    debug: boolean;
    toggleDebug(): void;
    restart(): void;
    togglePause(): void;
    update(dt: number): void;
    draw(ctx: CanvasRenderingContext2D): void;
    getNeighboringObjects<T extends IScreenObject>(point: IPoint, allObjects: T[]): T[];
    worldToScreenCoordinates(point: IPoint): IPoint;
    spawnBonus(type: BonusType, point: IPoint): void;
}

export interface IWall extends IScreenObject, IDrawable {
    orientation: 'vertical' | 'horizontal';
    getLeftTopCorner(): IPoint;
}

export interface IWallFactory {
    new (world: IWorld, point: IPoint, width: number, height: number, orientation: 'vertical' | 'horizontal'): IWall;
}

export type BonusType = 'aid_kit' | 'goggles';

export interface IBonus extends IScreenObject, IDrawable, IUpdatable {
    type: BonusType;
}

export interface IBonusFactory {
    new (world: IWorld, point: IPoint, type: BonusType): IBonus;
}


export interface IBullet extends IScreenObject, IDrawable, IUpdatable {
    checkHitsEnemies(): IEnemy[];
}

export interface IBulletFactory {
    new (world: IWorld, point: IPoint, rotation: number): IBullet;
}


export interface IPlayer extends IScreenObject, IDrawable, IUpdatable, IDamageable, IKillable, IShooter {
    nightVisionTimer: number;
    recordKill(reward: number): void;
    handleInput(keys: Set<string>, dt: number): void;
    heal(amount: number): void;
    addNightVision(): void;
    drawUI(ctx: CanvasRenderingContext2D): void;
    getTorchPoint(): IPoint;
    getGunPoint(): IPoint;
    money: number;
    kills: number;
    bulletsLeft: number;
}

export interface IPlayerFactory {
    new (world: IWorld, point: IPoint): IPlayer;
}

export interface IEnemy extends IScreenObject, IDrawable, IUpdatable, IDamageable, IKillable, IShooter {
    canSeePlayer(player: IPlayer): boolean;
}

export interface IEnemyFactory {
    new (world: IWorld, wall: IWall): IEnemy;
}

