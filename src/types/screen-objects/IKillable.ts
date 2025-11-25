export interface IKillable {
    isAlive(): boolean;
    die(withDrop?: boolean): void;
    lives: number;
}
