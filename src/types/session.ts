export interface SessionPlayer {
  player_id: string;
  name: string;
  lives: number;
  kills: number;
  money: number;
  is_alive: boolean;
  position: {
    x: number;
    y: number;
    rotation: number;
  };
}

export interface Session {
  id: string;
  name: string;
  startedAt: string;
  endedAt?: string;
  score: number;
  kills: number;
  money: number;
  world_map: Record<string, SessionChunk>;
  players: Record<string, SessionPlayer>;
  max_players?: number;
  is_private?: boolean;
  host: {
    id: string;
    username: string;
    email: string;
  };
}

export interface CreateSessionRequest {
  name: string;
}

export interface UpdateSessionRequest {
  score: number;
  kills: number;
  money: number;
}

export interface SessionObjectProperties {
  [key: string]: any;
}

export interface SessionObject {
  object_id: string;
  type: string;
  x: number;
  y: number;
  properties: SessionObjectProperties;
  owner_id?: string;
}

export interface SessionChunk {
  chunk_id: string;
  x: number;
  y: number;
  objects: Record<string, SessionObject>;
}

export interface AddSessionChunksRequest {
  chunks: SessionChunk[];
}
