import { Vector2D } from "../utils/geometry/Vector2D";
import { SessionPlayer } from "./session";

export type ServerResponseData = {
  date: number;
};

export type BulletCreatedData = ServerResponseData & {
  x: number;
  y: number;
  id: string;
  velocity: Vector2D;
  isEnemy: boolean;
  ownerId?: string;
};

export type BulletRemovedData = ServerResponseData & {
  id: string;
};

export type PositionUpdateData = ServerResponseData & {
  user_id: string;
  position: {
    x: number;
    y: number;
    rotation: number;
  };
};

export type PlayerJoinedData = ServerResponseData & {
  user: SessionPlayer;
};

export type PlayerLeftData = ServerResponseData & {
  user_id: SessionPlayer["player_id"];
};

export type GameStateData = ServerResponseData & {
  game_over: boolean;
};
