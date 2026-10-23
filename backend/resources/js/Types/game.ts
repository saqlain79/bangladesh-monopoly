export type SpaceType =
  | 'start'
  | 'property'
  | 'tax'
  | 'chance'
  | 'jail'
  | 'rail'
  | 'utility'
  | 'free'
  | 'gotojail';

export interface Space {
  name: string;
  type: SpaceType;
  price?: number;
  rent?: number;
  group?: string;
  color?: string;
  detail?: string;
}

export interface Player {
  id: number;
  name: string;
  token: string;
  cash: number;
  pos: number;
  color: string;
  out?: boolean;
}

export interface SavedSession {
  players: Player[];
  turn: number;
  owned: Record<number, number>;
  dice: [number, number];
  rolled: boolean;
  feed: string[];
  room: string;
  joined: boolean;
  roomName: string;
  page: 'landing' | 'game';
  playerId: number;
}

export interface GameStateProps {
  room: {
    id: number;
    code: string;
    name: string;
    status: string;
    state: {
      turn: number;
      properties: Record<number, number>;
      dice: [number, number] | null;
      last_roll: { player_id: number; from: number; to: number } | null;
    } | null;
    players: Array<{
      id: number;
      name: string;
      token: string;
      cash: number;
      position: number;
      seat: number;
      is_connected: boolean;
      is_bankrupt: boolean;
    }>;
  };
  playerId: number;
}

export interface LandingPageProps {}
